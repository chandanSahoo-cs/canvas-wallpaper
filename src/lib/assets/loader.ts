import { getAsset } from "./db";

export type AssetLodTier = "thumb" | "full";

export interface LoadedBitmapResult {
  bitmap: ImageBitmap | null;
  status: "ready" | "loading" | "not-found" | "error";
}

interface LruCacheEntry {
  key: string;
  assetId: string;
  tier: AssetLodTier;
  bitmap: ImageBitmap;
  bytes: number;
  lastUsed: number;
}

// 256 MB decoded-pixel memory budget (estimated at w * h * 4 bytes per bitmap)
export const MAX_CACHE_BYTES = 256 * 1024 * 1024;
export const THUMBNAIL_MAX_SCREEN_EDGE = 320;

class AssetBitmapLoader {
  private cache = new Map<string, LruCacheEntry>();
  private currentCacheBytes = 0;
  private pendingLoads = new Map<string, Promise<ImageBitmap | null>>();
  private failedAssets = new Set<string>();

  public getCacheStats() {
    return {
      entries: this.cache.size,
      totalBytes: this.currentCacheBytes,
      maxBytes: MAX_CACHE_BYTES,
      pending: this.pendingLoads.size,
    };
  }

  public getLodTier(width: number, height: number, zoom: number): AssetLodTier {
    const onScreenWidth = Math.abs(width) * zoom;
    const onScreenHeight = Math.abs(height) * zoom;
    if (
      onScreenWidth <= THUMBNAIL_MAX_SCREEN_EDGE &&
      onScreenHeight <= THUMBNAIL_MAX_SCREEN_EDGE
    ) {
      return "thumb";
    }
    return "full";
  }

  private makeKey(assetId: string, tier: AssetLodTier): string {
    return `${assetId}:${tier}`;
  }

  public getOrLoadAssetBitmap(
    assetId: string,
    tier: AssetLodTier,
    onLoaded?: () => void,
  ): LoadedBitmapResult {
    if (!assetId) {
      return { bitmap: null, status: "not-found" };
    }

    if (this.failedAssets.has(assetId)) {
      return { bitmap: null, status: "not-found" };
    }

    const key = this.makeKey(assetId, tier);
    const cached = this.cache.get(key);
    if (cached) {
      cached.lastUsed = Date.now();
      return { bitmap: cached.bitmap, status: "ready" };
    }

    // If full tier is cached and thumb was requested, we can use the full tier seamlessly
    if (tier === "thumb") {
      const fullCached = this.cache.get(this.makeKey(assetId, "full"));
      if (fullCached) {
        fullCached.lastUsed = Date.now();
        return { bitmap: fullCached.bitmap, status: "ready" };
      }
    }

    // If load is already in-flight, return loading status
    if (this.pendingLoads.has(key)) {
      return { bitmap: null, status: "loading" };
    }

    // Trigger load
    this.initiateLoad(assetId, tier, key, onLoaded);
    return { bitmap: null, status: "loading" };
  }

  private initiateLoad(
    assetId: string,
    tier: AssetLodTier,
    key: string,
    onLoaded?: () => void,
  ): void {
    const promise = (async (): Promise<ImageBitmap | null> => {
      try {
        const asset = await getAsset(assetId);
        if (!asset || !asset.blob) {
          this.failedAssets.add(assetId);
          return null;
        }

        const blobToDecode =
          tier === "thumb" && asset.thumbBlob ? asset.thumbBlob : asset.blob;

        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(blobToDecode);
        } catch (decodeErr) {
          // If decoding thumbnail fails, fallback to main blob
          if (tier === "thumb" && asset.blob) {
            bitmap = await createImageBitmap(asset.blob);
          } else {
            throw decodeErr;
          }
        }

        const bytes = bitmap.width * bitmap.height * 4;
        this.addEntry(key, assetId, tier, bitmap, bytes);
        return bitmap;
      } catch (err) {
        console.warn(`Failed to decode image asset ${assetId}:`, err);
        this.failedAssets.add(assetId);
        return null;
      } finally {
        this.pendingLoads.delete(key);
        onLoaded?.();
      }
    })();

    this.pendingLoads.set(key, promise);
  }

  private addEntry(
    key: string,
    assetId: string,
    tier: AssetLodTier,
    bitmap: ImageBitmap,
    bytes: number,
  ): void {
    // If key already exists, close old bitmap
    const existing = this.cache.get(key);
    if (existing) {
      this.currentCacheBytes -= existing.bytes;
      try {
        existing.bitmap.close();
      } catch {}
      this.cache.delete(key);
    }

    // Evict least recently used entries if adding this entry exceeds budget
    while (
      this.cache.size > 0 &&
      this.currentCacheBytes + bytes > MAX_CACHE_BYTES
    ) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [k, entry] of this.cache.entries()) {
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        const entryToEvict = this.cache.get(oldestKey);
        if (entryToEvict) {
          this.currentCacheBytes -= entryToEvict.bytes;
          try {
            entryToEvict.bitmap.close();
          } catch {}
          this.cache.delete(oldestKey);
        }
      } else {
        break;
      }
    }

    this.cache.set(key, {
      key,
      assetId,
      tier,
      bitmap,
      bytes,
      lastUsed: Date.now(),
    });
    this.currentCacheBytes += bytes;
  }

  /**
   * Loads full-resolution image bitmap bypassing LOD for exports.
   * If already cached (full tier), returns it; otherwise fetches and decodes it.
   */
  public async loadFullImageBitmap(assetId: string): Promise<ImageBitmap | null> {
    if (!assetId) return null;
    const key = this.makeKey(assetId, "full");
    const cached = this.cache.get(key);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.bitmap;
    }

    const pending = this.pendingLoads.get(key);
    if (pending) {
      return await pending;
    }

    const asset = await getAsset(assetId);
    if (!asset || !asset.blob) return null;

    try {
      const bitmap = await createImageBitmap(asset.blob);
      const bytes = bitmap.width * bitmap.height * 4;
      this.addEntry(key, assetId, "full", bitmap, bytes);
      return bitmap;
    } catch (err) {
      console.warn(`Could not load full bitmap for asset ${assetId}:`, err);
      return null;
    }
  }

  public clear(): void {
    for (const entry of this.cache.values()) {
      try {
        entry.bitmap.close();
      } catch {}
    }
    this.cache.clear();
    this.currentCacheBytes = 0;
    this.pendingLoads.clear();
    this.failedAssets.clear();
  }
}

export const assetLoader = new AssetBitmapLoader();

export function getLodTier(width: number, height: number, zoom: number): AssetLodTier {
  return assetLoader.getLodTier(width, height, zoom);
}

export function getOrLoadAssetBitmap(
  assetId: string,
  tier: AssetLodTier,
  onLoaded?: () => void,
): LoadedBitmapResult {
  return assetLoader.getOrLoadAssetBitmap(assetId, tier, onLoaded);
}

export function loadFullImageBitmap(assetId: string): Promise<ImageBitmap | null> {
  return assetLoader.loadFullImageBitmap(assetId);
}
