import { newId } from "../utils";
import { getAssetByHash, saveAsset } from "./db";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  AssetSource,
  MAX_FILE_SIZE_BYTES,
  MAX_MEGAPIXELS,
  MAX_ORIGINAL_SIZE_BYTES,
  MAX_RE_ENCODE_EDGE,
  MAX_THUMBNAIL_EDGE,
  StoredAsset,
} from "./types";

/**
 * Compute SHA-256 hex string from any Blob or ArrayBuffer.
 * DOM-free and works in browser window, Web Worker, or Service Worker.
 */
export async function computeBlobHash(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * DOM-free image ingestion pipeline.
 * Uses createImageBitmap and OffscreenCanvas (no document, new Image, or FileReader).
 * Suitable for main thread, Web Worker, or MV3 background service worker.
 */
export async function ingestImage(
  blob: Blob,
  source?: AssetSource,
): Promise<StoredAsset> {
  if (!blob) {
    throw new Error("No image data provided.");
  }

  // 1. MIME type validation
  const mime = blob.type.toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    throw new Error(
      `Unsupported image format (${blob.type || "unknown"}). Supported formats: PNG, JPEG, WebP, GIF (first frame), and AVIF. Vector SVG is not supported.`,
    );
  }

  // 2. File size guard (50 MB limit)
  if (blob.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Image size (${(blob.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of 50 MB.`,
    );
  }

  // 3. Decode image with createImageBitmap
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch (err: any) {
    throw new Error(
      `Failed to decode image data: ${err?.message || "Corrupt or unrecognized image file."}`,
    );
  }

  try {
    const width = bitmap.width;
    const height = bitmap.height;

    // 4. Megapixel guard (~100 MP)
    const megaPixels = (width * height) / 1_000_000;
    if (megaPixels > MAX_MEGAPIXELS) {
      throw new Error(
        `Image resolution (${width}x${height}, ~${megaPixels.toFixed(0)} MP) exceeds maximum 100 megapixel limit.`,
      );
    }

    // 5. Check if main image needs re-encoding (> 25 MB)
    let finalBlob = blob;
    let finalMime = mime;
    let finalBytes = blob.size;

    if (blob.size > MAX_ORIGINAL_SIZE_BYTES) {
      const scale = Math.min(
        MAX_RE_ENCODE_EDGE / width,
        MAX_RE_ENCODE_EDGE / height,
        1,
      );
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));

      const reencodeCanvas = new OffscreenCanvas(targetW, targetH);
      const reencodeCtx = reencodeCanvas.getContext("2d");
      if (!reencodeCtx) {
        throw new Error("Failed to allocate 2D context on OffscreenCanvas.");
      }
      reencodeCtx.drawImage(bitmap, 0, 0, targetW, targetH);
      finalBlob = await reencodeCanvas.convertToBlob({
        type: "image/webp",
        quality: 0.88,
      });
      finalMime = "image/webp";
      finalBytes = finalBlob.size;
    }

    // 6. Compute hash of the stored blob for deduplication
    const hash = await computeBlobHash(finalBlob);

    // Deduplication check: re-use existing asset if hash matches
    const existing = await getAssetByHash(hash);
    if (existing) {
      return existing;
    }

    // 7. Generate 320px WebP thumbnail
    const thumbScale = Math.min(
      MAX_THUMBNAIL_EDGE / width,
      MAX_THUMBNAIL_EDGE / height,
      1,
    );
    const thumbW = Math.max(1, Math.round(width * thumbScale));
    const thumbH = Math.max(1, Math.round(height * thumbScale));

    const thumbCanvas = new OffscreenCanvas(thumbW, thumbH);
    const thumbCtx = thumbCanvas.getContext("2d");
    if (!thumbCtx) {
      throw new Error("Failed to allocate 2D context for thumbnail.");
    }
    thumbCtx.drawImage(bitmap, 0, 0, thumbW, thumbH);
    const thumbBlob = await thumbCanvas.convertToBlob({
      type: "image/webp",
      quality: 0.82,
    });

    // 8. Construct StoredAsset record
    const asset: StoredAsset = {
      id: newId(),
      kind: "image",
      blob: finalBlob,
      thumbBlob,
      width,
      height,
      mime: finalMime,
      bytes: finalBytes,
      hash,
      createdAt: Date.now(),
      source,
    };

    // 9. Persist to IndexedDB
    await saveAsset(asset);
    return asset;
  } finally {
    bitmap.close();
  }
}
