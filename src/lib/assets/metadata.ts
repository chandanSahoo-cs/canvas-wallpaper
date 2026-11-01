import { extractPaletteFromImageData, PaletteColor } from "./color";
import { computeDHashFromImageData } from "./hash";

export interface AssetMetadataResult {
  palette: PaletteColor[];
  phash: string;
}

/**
 * Computes deterministic color palette and 64-bit dHash from an ImageBitmap,
 * HTMLCanvasElement, or OffscreenCanvas.
 * Fully DOM-free.
 */
export function extractAssetMetadata(
  imageSource: ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
): AssetMetadataResult {
  // 1. Palette: downsample to 64x64 OffscreenCanvas
  const paletteCanvas = new OffscreenCanvas(64, 64);
  const paletteCtx = paletteCanvas.getContext("2d", { willReadFrequently: true });
  let palette: PaletteColor[] = [{ hex: "#0E1A1F", weight: 1.0 }];

  if (paletteCtx) {
    paletteCtx.drawImage(imageSource, 0, 0, 64, 64);
    const imgData = paletteCtx.getImageData(0, 0, 64, 64);
    palette = extractPaletteFromImageData(imgData.data, 5);
  }

  // 2. pHash: resize to 9x8 OffscreenCanvas
  const hashCanvas = new OffscreenCanvas(9, 8);
  const hashCtx = hashCanvas.getContext("2d", { willReadFrequently: true });
  let phash = "0000000000000000";

  if (hashCtx) {
    hashCtx.drawImage(imageSource, 0, 0, 9, 8);
    const hashData = hashCtx.getImageData(0, 0, 9, 8);
    phash = computeDHashFromImageData(hashData.data);
  }

  return { palette, phash };
}

/**
 * Extract metadata directly from a Blob by decoding it with createImageBitmap.
 */
export async function extractAssetMetadataFromBlob(
  blob: Blob,
): Promise<AssetMetadataResult> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(blob);
    return extractAssetMetadata(bitmap);
  } catch (err) {
    console.warn("Could not decode blob for metadata extraction:", err);
    return {
      palette: [{ hex: "#0E1A1F", weight: 1.0 }],
      phash: "0000000000000000",
    };
  } finally {
    if (bitmap) {
      try {
        bitmap.close();
      } catch {}
    }
  }
}
