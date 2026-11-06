import { ingestImage } from "../assets/ingest";
import { getAssetByHash, saveAsset } from "../assets/db";
import { createOrUpdateTag } from "../search/tags";
import { getInboxItems, saveInboxItems } from "../inbox/storage";
import { InboxItem } from "../inbox/types";
import { Scene, useSceneStore } from "../../store/useSceneStore";
import { SCHEMA_VERSION, SCENE_KEY_PREFIX, removeStorageItems } from "../scenes/storage";
import { remapSceneAssetIds, remapInboxAssetIds } from "./remap";
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

  // a. Guard: merge mode requires loadStatus "ok"/"degraded", else throw a clear error.
  //    Replace mode must refuse (throw) if the backup contains zero readable boards.
  const currentLoadStatus = useSceneStore.getState().loadStatus;
  if (mode === "merge" && currentLoadStatus !== "ok" && currentLoadStatus !== "degraded") {
    throw new Error("Cannot merge backup: board storage is in error state.");
  }

  if (mode === "replace") {
    let readableBoards = 0;
    for (const [path, data] of entries.entries()) {
      if (path.startsWith("scenes/") && path.endsWith(".json")) {
        try {
          const sc = JSON.parse(decoder.decode(data));
          if (sc && sc.id && Array.isArray(sc.elements)) {
            readableBoards++;
          }
        } catch {}
      }
    }
    if (readableBoards === 0) {
      throw new Error("Backup archive contains zero readable boards. Restore aborted.");
    }
  }

  onProgress?.({
    phase: "reading",
    current: 0,
    total: 100,
    percentage: 5,
    message: "Initializing backup restoration...",
  });

  // b. Ingest assets (additive only; nothing existing is touched yet) -> hash -> new asset id
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

  // c. Parse library.json: tags (await each, ignore failures), per-asset metadata,
  //    and build idMap (old id -> new id via assetMeta id/hash and the hash map).
  //    Remap backup inbox items.
  onProgress?.({
    phase: "library",
    current: 75,
    total: 100,
    percentage: 75,
    message: "Restoring tags, notes, and metadata...",
  });

  const idMap = new Map<string, string>();
  let backupInbox: InboxItem[] = [];

  const libraryDataRaw = entries.get("library.json");
  if (libraryDataRaw) {
    try {
      const lib = JSON.parse(decoder.decode(libraryDataRaw));

      // Build idMap from assetMeta
      if (Array.isArray(lib.assetMeta)) {
        for (const meta of lib.assetMeta) {
          if (meta.id && meta.hash && hashToAssetIdMap.has(meta.hash)) {
            idMap.set(meta.id, hashToAssetIdMap.get(meta.hash)!);
          }
        }
      }

      // Restore tags (await each, ignore failures)
      if (lib.tags && typeof lib.tags === "object") {
        for (const [name, meta] of Object.entries<any>(lib.tags)) {
          try {
            await createOrUpdateTag(name, meta?.color);
          } catch (tagErr) {
            console.warn(`Failed to restore tag ${name}:`, tagErr);
          }
        }
      }

      // Restore asset metadata extensions
      if (Array.isArray(lib.assetMeta)) {
        for (const meta of lib.assetMeta) {
          if (meta.hash && hashToAssetIdMap.has(meta.hash)) {
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

      // Remap backup inbox items
      if (Array.isArray(lib.inbox)) {
        backupInbox = remapInboxAssetIds(lib.inbox as InboxItem[], idMap);
      }
    } catch (err) {
      console.warn("Failed to parse library.json during restore:", err);
    }
  }

  // d. Parse scenes, remap them, handle merge-mode id collisions as today
  onProgress?.({
    phase: "scenes",
    current: 85,
    total: 100,
    percentage: 85,
    message: "Restoring boards and drawings...",
  });

  const currentScenes = useSceneStore.getState().scenes;
  const newScenes: Scene[] = [];

  for (const [path, data] of entries.entries()) {
    if (path.startsWith("scenes/") && path.endsWith(".json")) {
      try {
        const rawScene: Scene = JSON.parse(decoder.decode(data));
        if (rawScene && rawScene.id && Array.isArray(rawScene.elements)) {
          let targetScene = remapSceneAssetIds(rawScene, idMap);
          if (mode === "merge" && currentScenes.some((s) => s.id === targetScene.id)) {
            targetScene = {
              ...targetScene,
              id: `${targetScene.id}-${Date.now().toString(36).slice(-4)}`,
              name: `${targetScene.name} (Imported)`,
            };
          }
          newScenes.push(targetScene);
        }
      } catch (err) {
        console.warn(`Failed to parse scene ${path}:`, err);
      }
    }
  }

  if (mode === "replace" && newScenes.length === 0) {
    throw new Error("Backup archive contains zero readable boards. Restore aborted.");
  }

  // e. Apply: set scenes + active id (replace -> first restored board; merge -> keep the current active board);
  //    in replace mode set loadStatus: "ok". Call saveScenesToStorage({ all: true }).
  //    Replace: then remove scene:<id> keys of boards not in the backup and overwrite the inbox.
  //    Merge: add backup inbox items whose ids are not present and count only those actually added.
  let scenesRestored = newScenes.length;
  let inboxRestored = 0;

  if (mode === "replace") {
    const previousScenes = useSceneStore.getState().scenes;
    const activeId = newScenes[0].id;

    useSceneStore.setState({
      scenes: newScenes,
      activeSceneId: activeId,
      loadStatus: "ok",
    });

    await useSceneStore.getState().saveScenesToStorage({ all: true });

    // Remove scene:<id> keys of boards not in the backup
    const newSceneIds = new Set(newScenes.map((s) => s.id));
    const staleKeys = previousScenes
      .filter((s) => !newSceneIds.has(s.id))
      .map((s) => SCENE_KEY_PREFIX + s.id);
    if (staleKeys.length > 0) {
      await removeStorageItems(staleKeys).catch(() => {});
    }

    // Overwrite the inbox
    await saveInboxItems(backupInbox);
    inboxRestored = backupInbox.length;
  } else {
    // Merge mode
    const currentActiveId = useSceneStore.getState().activeSceneId;
    const combinedScenes = [...currentScenes, ...newScenes];

    useSceneStore.setState({
      scenes: combinedScenes,
      activeSceneId: currentActiveId,
    });

    await useSceneStore.getState().saveScenesToStorage({ all: true });

    // Add backup inbox items whose ids are not present
    const currentInbox = await getInboxItems();
    const currentInboxIds = new Set(currentInbox.map((it) => it.id));
    const toAdd = backupInbox.filter((it) => !currentInboxIds.has(it.id));
    if (toAdd.length > 0) {
      await saveInboxItems([...currentInbox, ...toAdd]);
    }
    inboxRestored = toAdd.length;
  }

  // f. await loadScenesFromStorage() so the canvas shows the restored active board
  onProgress?.({
    phase: "finalizing",
    current: 100,
    total: 100,
    percentage: 100,
    message: "Rebuilding indexes and finalizing...",
  });

  await useSceneStore.getState().loadScenesFromStorage();
  await useResurfaceStore.getState().syncFromScenes(useSceneStore.getState().scenes);

  return {
    scenesRestored,
    assetsImported,
    assetsDeduped,
    inboxRestored,
  };
}
