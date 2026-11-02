import { getAllAssets, getAsset, saveAsset, deleteAsset } from "../assets/db";
import { ImageElement } from "../../elements/types";
import { Scene, useSceneStore } from "../../store/useSceneStore";
import { getInboxItems } from "../inbox/storage";

export const LAST_BACKUP_KEY = "papertab_last_backup_at";
export const BACKUP_NUDGE_DISMISSED_KEY = "papertab_backup_nudge_dismissed_at";

export interface LargestItem {
  id: string;
  hash: string;
  bytes: number;
  width: number;
  height: number;
  mime: string;
  note?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  boardUsageCount: number;
  boardNames: string[];
}

export interface MissingAssetReference {
  boardId: string;
  boardName: string;
  assetId: string;
  elementId?: string;
  isBackground: boolean;
}

export interface StorageHealthSummary {
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  originalBytes: number;
  thumbnailBytes: number;
  totalAssets: number;
  totalBoards: number;
  largestItems: LargestItem[];
  orphanAssetIds: string[];
  orphanBytes: number;
  missingReferences: MissingAssetReference[];
  lastBackupTimestamp: number | null;
  daysSinceBackup: number | null;
}

/**
 * Computes a comprehensive storage diagnostic summary:
 * quota, usage, asset bytes breakdown, largest assets, orphan assets, and integrity.
 */
export async function getStorageHealthSummary(): Promise<StorageHealthSummary> {
  // 1. Storage estimate
  let usageBytes = 0;
  let quotaBytes = 0;
  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {}
  }

  const percentUsed =
    quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;

  // 2. Assets inspection
  const assets = await getAllAssets();
  const assetIdSet = new Set(assets.map((a) => a.id));

  let originalBytes = 0;
  let thumbnailBytes = 0;

  for (const a of assets) {
    originalBytes += a.bytes || a.blob.size || 0;
    thumbnailBytes += a.thumbBlob?.size || 0;
  }

  // 3. Board references mapping
  const scenes: Scene[] = useSceneStore.getState().scenes;
  const assetUsageMap = new Map<string, { count: number; boards: Set<string> }>();
  const missingReferences: MissingAssetReference[] = [];

  for (const s of scenes) {
    // Check background image
    if (s.background?.type === "image" && s.background.imageAssetId) {
      const aid = s.background.imageAssetId;
      if (!assetIdSet.has(aid)) {
        missingReferences.push({
          boardId: s.id,
          boardName: s.name,
          assetId: aid,
          isBackground: true,
        });
      } else {
        const usage = assetUsageMap.get(aid) || { count: 0, boards: new Set() };
        usage.count++;
        usage.boards.add(s.name);
        assetUsageMap.set(aid, usage);
      }
    }

    // Check scene elements
    for (const el of s.elements) {
      if (el.type === "image") {
        const img = el as ImageElement;
        if (img.assetId) {
          if (!assetIdSet.has(img.assetId)) {
            missingReferences.push({
              boardId: s.id,
              boardName: s.name,
              assetId: img.assetId,
              elementId: img.id,
              isBackground: false,
            });
          } else {
            const usage = assetUsageMap.get(img.assetId) || {
              count: 0,
              boards: new Set(),
            };
            usage.count++;
            usage.boards.add(s.name);
            assetUsageMap.set(img.assetId, usage);
          }
        }
      }
    }
  }

  // Also check inbox items
  const inbox = await getInboxItems();
  for (const it of inbox) {
    if (it.assetId) {
      const usage = assetUsageMap.get(it.assetId) || {
        count: 0,
        boards: new Set(),
      };
      usage.count++;
      usage.boards.add("Inbox");
      assetUsageMap.set(it.assetId, usage);
    }
  }

  // 4. Orphan detection
  const orphanAssetIds: string[] = [];
  let orphanBytes = 0;
  for (const a of assets) {
    if (!assetUsageMap.has(a.id)) {
      orphanAssetIds.push(a.id);
      orphanBytes += a.bytes || a.blob.size || 0;
    }
  }

  // 5. Top 10 largest items
  const sortedByBytes = [...assets].sort(
    (a, b) => (b.bytes || b.blob.size) - (a.bytes || a.blob.size),
  );
  const largestItems: LargestItem[] = sortedByBytes.slice(0, 10).map((a) => {
    const usage = assetUsageMap.get(a.id);
    return {
      id: a.id,
      hash: a.hash,
      bytes: a.bytes || a.blob.size,
      width: a.width,
      height: a.height,
      mime: a.mime,
      note: a.note,
      sourceUrl: a.source?.url,
      sourceTitle: a.source?.title,
      boardUsageCount: usage ? usage.count : 0,
      boardNames: usage ? Array.from(usage.boards) : [],
    };
  });

  // 6. Backup age tracking
  const lastBackupTimestamp = getLastBackupTimestamp();
  let daysSinceBackup: number | null = null;
  if (lastBackupTimestamp) {
    daysSinceBackup = Math.max(
      0,
      Math.floor((Date.now() - lastBackupTimestamp) / (24 * 60 * 60 * 1000)),
    );
  }

  return {
    usageBytes,
    quotaBytes,
    percentUsed,
    originalBytes,
    thumbnailBytes,
    totalAssets: assets.length,
    totalBoards: scenes.length,
    largestItems,
    orphanAssetIds,
    orphanBytes,
    missingReferences,
    lastBackupTimestamp,
    daysSinceBackup,
  };
}

/**
 * Recompresses an asset to max 4096px at WebP quality 0.9.
 * Reclaims space while keeping high fidelity.
 */
export async function recompressAsset(
  assetId: string,
  maxEdge = 4096,
  quality = 0.9,
): Promise<{ oldBytes: number; newBytes: number; savedBytes: number }> {
  const asset = await getAsset(assetId);
  if (!asset) {
    throw new Error(`Asset ${assetId} not found`);
  }

  const oldBytes = asset.bytes || asset.blob.size;
  const bitmap = await createImageBitmap(asset.blob);

  let w = bitmap.width;
  let h = bitmap.height;

  // Downsample to maxEdge if larger
  if (w > maxEdge || h > maxEdge) {
    if (w > h) {
      h = Math.round((h * maxEdge) / w);
      w = maxEdge;
    } else {
      w = Math.round((w * maxEdge) / h);
      h = maxEdge;
    }
  }

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to initialize canvas context");
  }

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const newBlob = await canvas.convertToBlob({
    type: "image/webp",
    quality,
  });

  const newBytes = newBlob.size;

  // If recompression actually made it larger, keep the original!
  if (newBytes >= oldBytes) {
    return { oldBytes, newBytes: oldBytes, savedBytes: 0 };
  }

  // Update hash
  const ab = await newBlob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", ab);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const newHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const updatedAsset = {
    ...asset,
    blob: newBlob,
    bytes: newBytes,
    hash: newHash,
    width: w,
    height: h,
    mime: "image/webp",
  };

  await saveAsset(updatedAsset);

  return {
    oldBytes,
    newBytes,
    savedBytes: oldBytes - newBytes,
  };
}

/**
 * Cleans up unreferenced orphan assets.
 */
export async function cleanupOrphans(
  orphanIds: string[],
): Promise<{ deletedCount: number; reclaimedBytes: number }> {
  let deletedCount = 0;
  let reclaimedBytes = 0;

  for (const id of orphanIds) {
    try {
      const asset = await getAsset(id);
      if (asset) {
        reclaimedBytes += asset.bytes || asset.blob.size || 0;
        await deleteAsset(id);
        deletedCount++;
      }
    } catch (err) {
      console.warn(`Failed to delete orphan asset ${id}:`, err);
    }
  }

  return { deletedCount, reclaimedBytes };
}

/**
 * Deletes an asset and removes all its placements across all boards and backgrounds.
 */
export async function deleteAssetWithPlacements(
  assetId: string,
): Promise<{ deleted: boolean; placementsRemoved: number }> {
  let placementsRemoved = 0;
  const scenes = useSceneStore.getState().scenes;
  const updatedScenes = scenes.map((s) => {
    let changed = false;
    let bg = s.background;
    if (bg?.type === "image" && bg.imageAssetId === assetId) {
      bg = { type: "color", color: bg.color || "#f6faf8" };
      placementsRemoved++;
      changed = true;
    }

    const filteredElements = s.elements.filter((el) => {
      if (el.type === "image" && (el as ImageElement).assetId === assetId) {
        placementsRemoved++;
        changed = true;
        return false;
      }
      return true;
    });

    if (changed) {
      return { ...s, background: bg, elements: filteredElements };
    }
    return s;
  });

  useSceneStore.setState({ scenes: updatedScenes });
  await useSceneStore.getState().saveScenesToStorage();
  await deleteAsset(assetId);

  return { deleted: true, placementsRemoved };
}

// ----------------- Backup Nudge Helpers -----------------

export function getLastBackupTimestamp(): number | null {
  try {
    if (typeof localStorage !== "undefined") {
      const val = localStorage.getItem(LAST_BACKUP_KEY);
      return val ? parseInt(val, 10) : null;
    }
  } catch {}
  return null;
}

export function recordBackupCompleted(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
    }
  } catch {}
}

export function dismissBackupNudge(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(BACKUP_NUDGE_DISMISSED_KEY, Date.now().toString());
    }
  } catch {}
}

export function shouldShowBackupNudge(): {
  show: boolean;
  daysSinceBackup: number;
} {
  try {
    const lastBackup = getLastBackupTimestamp();
    if (!lastBackup) {
      // First-time or no backup yet: don't annoy immediately, wait 7 days from install
      return { show: false, daysSinceBackup: 0 };
    }

    const now = Date.now();
    const daysSinceBackup = Math.floor(
      (now - lastBackup) / (24 * 60 * 60 * 1000),
    );

    if (daysSinceBackup < 7) {
      return { show: false, daysSinceBackup };
    }

    // Check if dismissed in the last 7 days
    const dismissedAt = localStorage.getItem(BACKUP_NUDGE_DISMISSED_KEY);
    if (dismissedAt) {
      const daysSinceDismiss = Math.floor(
        (now - parseInt(dismissedAt, 10)) / (24 * 60 * 60 * 1000),
      );
      if (daysSinceDismiss < 7) {
        return { show: false, daysSinceBackup };
      }
    }

    return { show: true, daysSinceBackup };
  } catch {
    return { show: false, daysSinceBackup: 0 };
  }
}
