import { deleteAsset, getAllAssets } from "./db";
import { GC_MAX_AGE_MS } from "./types";

export interface GcReport {
  scanned: number;
  deletedCount: number;
  freedBytes: number;
}

/**
 * Startup garbage collector for assets.
 * Deletes assets that are completely unreferenced by any scene (elements or background)
 * AND are older than 7 days (preserving assets needed for recent undo or other tabs).
 */
export async function runAssetGarbageCollection(
  referencedAssetIds: Set<string>,
): Promise<GcReport> {
  const report: GcReport = {
    scanned: 0,
    deletedCount: 0,
    freedBytes: 0,
  };

  try {
    const assets = await getAllAssets();
    report.scanned = assets.length;
    const now = Date.now();

    for (const asset of assets) {
      const isReferenced = referencedAssetIds.has(asset.id);
      const isExpired = now - asset.createdAt > GC_MAX_AGE_MS;

      if (!isReferenced && isExpired) {
        await deleteAsset(asset.id);
        report.deletedCount++;
        report.freedBytes += asset.bytes;
      }
    }
  } catch (err) {
    console.warn("Asset garbage collection failed:", err);
  }

  return report;
}
