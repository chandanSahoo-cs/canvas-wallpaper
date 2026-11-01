import { getAsset } from "./db";

const urlCache = new Map<string, string>();

/**
 * Returns a stable Object URL for an asset's display blob.
 * Automatically manages object URLs and caches them during the session.
 */
export async function getAssetObjectUrl(
  assetId: string,
): Promise<string | null> {
  if (!assetId) return null;
  const cached = urlCache.get(assetId);
  if (cached) return cached;

  const asset = await getAsset(assetId);
  if (!asset || !asset.blob) return null;

  const url = URL.createObjectURL(asset.blob);
  urlCache.set(assetId, url);
  return url;
}

/**
 * Returns a stable Object URL for an asset's thumbnail blob.
 */
export async function getAssetThumbObjectUrl(
  assetId: string,
): Promise<string | null> {
  if (!assetId) return null;
  const key = `thumb:${assetId}`;
  const cached = urlCache.get(key);
  if (cached) return cached;

  const asset = await getAsset(assetId);
  if (!asset || !asset.thumbBlob) return null;

  const url = URL.createObjectURL(asset.thumbBlob);
  urlCache.set(key, url);
  return url;
}

/**
 * Explicitly revokes and evicts an object URL.
 */
export function revokeAssetObjectUrl(assetId: string): void {
  const url = urlCache.get(assetId);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(assetId);
  }
  const thumbUrl = urlCache.get(`thumb:${assetId}`);
  if (thumbUrl) {
    URL.revokeObjectURL(thumbUrl);
    urlCache.delete(`thumb:${assetId}`);
  }
}

/**
 * Clears all cached object URLs.
 */
export function clearAssetObjectUrls(): void {
  for (const url of urlCache.values()) {
    URL.revokeObjectURL(url);
  }
  urlCache.clear();
}
