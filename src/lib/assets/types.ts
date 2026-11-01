export interface AssetSource {
  url?: string;
  title?: string;
  savedAt?: number;
}

export interface StoredAsset {
  id: string;
  kind: "image";
  blob: Blob;
  thumbBlob: Blob;
  width: number;
  height: number;
  mime: string;
  bytes: number;
  hash: string; // SHA-256 hex string of the stored blob
  createdAt: number;
  source?: AssetSource;
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif", // First frame only
  "image/avif",
]);

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_ORIGINAL_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB before re-encode
export const MAX_MEGAPIXELS = 100; // ~100 megapixels
export const MAX_RE_ENCODE_EDGE = 4096;
export const MAX_THUMBNAIL_EDGE = 320;
export const GC_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
