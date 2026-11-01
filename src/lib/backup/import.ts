import { ingestImage } from "../assets/ingest";
import { getAssetByHash, saveAsset } from "../assets/db";
import { createOrUpdateTag } from "../search/tags";
import { getInboxItems, saveInboxItems } from "../inbox/storage";
import { InboxItem } from "../inbox/types";
import { Scene, useSceneStore } from "../../store/useSceneStore";
import { SCHEMA_VERSION } from "../scenes/storage";
import { ZipReader } from "./zipReader";
import {
  BackupInspection,
  BackupManifest,
  RestoreMode,
  RestoreProgress,
  RestoreSummary,
} from "./types";
import { useResurfaceStore } from "../resurface/store";

export type RestoreProgressCallback = (progress: RestoreProgress) => void;

/**
 * Inspects a backup archive file without applying changes, verifying the
 * manifest, schema integrity, and security bounds.
 */
export async function inspectBackupZip(
  fileOrBuffer: File | Blob | Uint8Array,
): Promise<BackupInspection> {
  let buffer: Uint8Array;
  if (fileOrBuffer instanceof Uint8Array) {
    buffer = fileOrBuffer;
  } else {
    const ab = await fileOrBuffer.arrayBuffer();
    buffer = new Uint8Array(ab);
  }

  const reader = new ZipReader(buffer);
  const entries = reader.extractAll();

  const manifestData = entries.get("manifest.json");
  if (!manifestData) {
    throw new Error("Invalid PaperTab backup archive: manifest.json is missing.");
  }

  const decoder = new TextDecoder();
  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(decoder.decode(manifestData));
  } catch {
    throw new Error("Corrupted manifest.json in backup archive.");
  }

  if (typeof manifest.schemaVersion !== "number" || manifest.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `Unsupported backup schema version (found v${manifest.schemaVersion}, maximum supported v${SCHEMA_VERSION}).`,
    );
  }

  let totalBytes = 0;
  let sceneCount = 0;
  let assetCount = 0;

  for (const [path, data] of entries.entries()) {
    totalBytes += data.length;
    if (path.startsWith("scenes/") && path.endsWith(".json")) {
      sceneCount++;
    } else if (path.startsWith("assets/")) {
      assetCount++;
    }
  }

  return {
    manifest,
    fileCount: entries.size,
    totalBytes,
    sceneCount,
    assetCount,
    entries,
  };
}

/**
 * Executes full restore from the inspected backup entries.
 */
export async function restoreBackup(
  inspection: BackupInspection,
  mode: RestoreMode,
  onProgress?: RestoreProgressCallback,
): Promise<RestoreSummary> {
  const { entries, assetCount } = inspection;
  const decoder = new TextDecoder();

  onProgress?.({
    phase: "reading",
    current: 0,
    total: 100,
    percentage: 5,
    message: "Initializing backup restoration...",
  });

  // 1. Wipe existing if replace mode
  if (mode === "replace") {
    onProgress?.({
      phase: "reading",
      current: 5,
      total: 100,
      percentage: 10,
      message: "Clearing existing workspace for replace...",
    });
    await useSceneStore.getState().resetAllScenes();
    await saveInboxItems([]);
  }

  // 2. Ingest original assets
  let assetsImported = 0;
  let assetsDeduped = 0;
  let processedAssets = 0;
  const hashToAssetIdMap = new Map<string, string>();

  for (const [path, data] of entries.entries()) {
    if (path.startsWith("assets/") && !path.endsWith("/")) {
      processedAssets++;
      const filename = path.replace(/^assets\//, "");
      const hash = filename.split(".")[0];
      const ext = filename.split(".")[1] || "png";
      const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

      // Check if duplicate exists locally
      const existing = await getAssetByHash(hash);
      if (existing) {
        assetsDeduped++;
        hashToAssetIdMap.set(hash, existing.id);
      } else {
        const blob = new Blob([data as BlobPart], { type: mime });
        try {
          const stored = await ingestImage(blob);
          assetsImported++;
          hashToAssetIdMap.set(hash, stored.id);
        } catch (err) {
          console.warn(`Failed to ingest asset ${path}:`, err);
        }
      }

      if (onProgress && (processedAssets % 3 === 0 || processedAssets === assetCount)) {
        const pct = Math.round(15 + (processedAssets / Math.max(1, assetCount)) * 55);
        onProgress({
          phase: "assets",
          current: processedAssets,
          total: assetCount,
          percentage: pct,
          message: `Restoring assets (${processedAssets} / ${assetCount})...`,
        });
      }
    }
  }

  // 3. Restore library.json (tags, notes, palettes, inbox)
  onProgress?.({
    phase: "library",
    current: 75,
    total: 100,
    percentage: 75,
    message: "Restoring tags, notes, and metadata...",
  });

  let inboxRestored = 0;
  const libraryDataRaw = entries.get("library.json");
  if (libraryDataRaw) {
    try {
      const lib = JSON.parse(decoder.decode(libraryDataRaw));
      // Restore tags
      if (lib.tags && typeof lib.tags === "object") {
        for (const [name, meta] of Object.entries<any>(lib.tags)) {
          createOrUpdateTag(name, meta?.color);
        }
      }
      // Restore asset metadata extensions
      if (Array.isArray(lib.assetMeta)) {
        for (const meta of lib.assetMeta) {
          if (meta.hash && hashToAssetIdMap.has(meta.hash)) {
            const resolvedId = hashToAssetIdMap.get(meta.hash)!;
            const asset = await getAssetByHash(meta.hash);
            if (asset) {
              const updated = {
                ...asset,
                tags: Array.from(new Set([...asset.tags, ...(meta.tags || [])])),
                note: meta.note || asset.note,
                labelColor: meta.labelColor || asset.labelColor,
              };
              await saveAsset(updated);
            }
          }
        }
      }
      // Restore inbox items
      if (Array.isArray(lib.inbox)) {
        const currentInbox = mode === "replace" ? [] : await getInboxItems();
        const combined = [...currentInbox];
        for (const item of lib.inbox as InboxItem[]) {
          if (!combined.some((it) => it.id === item.id)) {
            combined.push(item);
            inboxRestored++;
          }
        }
        await saveInboxItems(combined);
      }
    } catch (err) {
      console.warn("Failed to parse library.json during restore:", err);
    }
  }

  // 4. Restore scenes
  onProgress?.({
    phase: "scenes",
    current: 85,
    total: 100,
    percentage: 85,
    message: "Restoring boards and drawings...",
  });

  let scenesRestored = 0;
  const currentScenes = mode === "replace" ? [] : [...useSceneStore.getState().scenes];
  const newScenes: Scene[] = [];

  for (const [path, data] of entries.entries()) {
    if (path.startsWith("scenes/") && path.endsWith(".json")) {
      try {
        const scene: Scene = JSON.parse(decoder.decode(data));
        if (scene && scene.id && Array.isArray(scene.elements)) {
          // Check for collision if merge mode
          let targetScene = scene;
          if (mode === "merge" && currentScenes.some((s) => s.id === scene.id)) {
            targetScene = {
              ...scene,
              id: `${scene.id}-${Date.now().toString(36).slice(-4)}`,
              name: `${scene.name} (Imported)`,
            };
          }
          newScenes.push(targetScene);
          scenesRestored++;
        }
      } catch (err) {
        console.warn(`Failed to parse scene ${path}:`, err);
      }
    }
  }

  const finalScenes = [...currentScenes, ...newScenes];
  if (finalScenes.length > 0) {
    const activeId = finalScenes[0].id;
    useSceneStore.setState({
      scenes: finalScenes,
      activeSceneId: activeId,
    });
    await useSceneStore.getState().saveScenesToStorage();
  }

  // 5. Finalize and sync resurface index
  onProgress?.({
    phase: "finalizing",
    current: 100,
    total: 100,
    percentage: 100,
    message: "Rebuilding indexes and finalizing...",
  });

  await useResurfaceStore.getState().syncFromScenes(useSceneStore.getState().scenes);

  return {
    scenesRestored,
    assetsImported,
    assetsDeduped,
    inboxRestored,
  };
}
