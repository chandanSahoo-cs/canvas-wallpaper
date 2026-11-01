import { getAllAssets } from "../assets/db";
import { getAllTagInfos } from "../search/tags";
import { getInboxItems } from "../inbox/storage";
import { Scene, useSceneStore } from "../../store/useSceneStore";
import { SCHEMA_VERSION } from "../scenes/storage";
import { ZipWriter } from "./zipWriter";
import { BackupManifest } from "./types";

export interface ExportProgress {
  phase: "collecting" | "assets" | "compressing" | "saving";
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function createBackupZip(
  onProgress?: ExportProgressCallback,
): Promise<{ blob: Blob; manifest: BackupManifest; byteCount: number }> {
  const zip = new ZipWriter();

  onProgress?.({
    phase: "collecting",
    current: 0,
    total: 100,
    percentage: 5,
    message: "Gathering boards and saved collection...",
  });

  const scenes: Scene[] = useSceneStore.getState().scenes;
  const assets = await getAllAssets();
  const inbox = await getInboxItems();
  const tags = await getAllTagInfos();

  const manifest: BackupManifest = {
    schemaVersion: SCHEMA_VERSION,
    appVersion: "1.0.0",
    exportedAt: Date.now(),
    counts: {
      scenes: scenes.length,
      assets: assets.length,
      inbox: inbox.length,
    },
  };

  // 1. manifest.json
  zip.addFile("manifest.json", JSON.stringify(manifest, null, 2));

  // 2. scenes/*.json
  for (const scene of scenes) {
    zip.addFile(`scenes/${scene.id}.json`, JSON.stringify(scene, null, 2));
  }

  // 3. library.json (tags, notes, sources, inbox)
  const libraryData = {
    tags,
    inbox,
    assetMeta: assets.map((a) => ({
      id: a.id,
      hash: a.hash,
      tags: a.tags,
      note: a.note,
      palette: a.palette,
      phash: a.phash,
      source: a.source,
      labelColor: a.labelColor,
    })),
  };
  zip.addFile("library.json", JSON.stringify(libraryData, null, 2));

  // 4. sources.csv
  const csvRows: string[] = ["Asset ID,Hash,Title,Source URL,Saved At"];
  for (const a of assets) {
    if (a.source?.url) {
      csvRows.push(
        [
          escapeCsvField(a.id),
          escapeCsvField(a.hash),
          escapeCsvField(a.source.title || a.note || ""),
          escapeCsvField(a.source.url),
          escapeCsvField(
            a.source.savedAt ? new Date(a.source.savedAt).toISOString() : "",
          ),
        ].join(","),
      );
    }
  }
  for (const it of inbox) {
    if (it.source?.url) {
      csvRows.push(
        [
          escapeCsvField(it.assetId || it.id),
          escapeCsvField(""),
          escapeCsvField(it.source.title || it.title || ""),
          escapeCsvField(it.source.url),
          escapeCsvField(
            it.source.savedAt ? new Date(it.source.savedAt).toISOString() : "",
          ),
        ].join(","),
      );
    }
  }
  zip.addFile("sources.csv", csvRows.join("\n"));

  // 5. assets/<hash>.<ext>
  const totalAssets = assets.length;
  for (let i = 0; i < totalAssets; i++) {
    const a = assets[i];
    const ext = a.mime.split("/")[1] || "png";
    const path = `assets/${a.hash}.${ext}`;

    const buffer = await a.blob.arrayBuffer();
    zip.addFile(path, new Uint8Array(buffer));

    if (onProgress && (i % 5 === 0 || i === totalAssets - 1)) {
      const pct = Math.round(10 + ((i + 1) / totalAssets) * 80);
      onProgress({
        phase: "assets",
        current: i + 1,
        total: totalAssets,
        percentage: pct,
        message: `Archiving assets (${i + 1} / ${totalAssets})...`,
      });
    }
  }

  onProgress?.({
    phase: "compressing",
    current: totalAssets,
    total: totalAssets,
    percentage: 95,
    message: "Finalizing ZIP package...",
  });

  const blob = zip.toBlob();

  return {
    blob,
    manifest,
    byteCount: blob.size,
  };
}

export async function exportEverything(
  onProgress?: ExportProgressCallback,
): Promise<{ success: boolean; filename?: string; aborted?: boolean }> {
  const dateStr = new Date().toISOString().split("T")[0];
  const suggestedFilename = `papertab-backup-${dateStr}.zip`;

  const { blob } = await createBackupZip(onProgress);

  onProgress?.({
    phase: "saving",
    current: 100,
    total: 100,
    percentage: 100,
    message: "Saving backup archive...",
  });

  // Try Native File System Access API
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: suggestedFilename,
        types: [
          {
            description: "PaperTab Backup Archive (.zip)",
            accept: { "application/zip": [".zip"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, filename: handle.name || suggestedFilename };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, aborted: true };
      }
      console.warn("showSaveFilePicker failed, falling back to download blob:", err);
    }
  }

  // Fallback: standard Blob download via anchor
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);

  return { success: true, filename: suggestedFilename };
}
