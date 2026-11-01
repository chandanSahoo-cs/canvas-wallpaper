import { getAsset } from "./db";
import { ingestImage } from "./ingest";

export interface SerializedAssetBundle {
  mime: string;
  base64: string;
  width?: number;
  height?: number;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Bundle all referenced assets into a self-contained map of base64 strings.
 */
export async function bundleAssets(
  assetIds: Iterable<string>,
): Promise<Record<string, SerializedAssetBundle>> {
  const bundle: Record<string, SerializedAssetBundle> = {};

  for (const id of assetIds) {
    if (!id || bundle[id]) continue;
    const asset = await getAsset(id);
    if (asset && asset.blob) {
      const base64 = await blobToBase64(asset.blob);
      bundle[id] = {
        mime: asset.mime,
        base64,
        width: asset.width,
        height: asset.height,
      };
    }
  }

  return bundle;
}

/**
 * Unpacks and ingests embedded assets, returning a mapping of oldAssetId -> newAssetId
 * with automatic SHA-256 deduplication.
 */
export async function unpackAndIngestAssets(
  bundle: Record<string, SerializedAssetBundle> | undefined,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  if (!bundle) return idMap;

  for (const [oldId, item] of Object.entries(bundle)) {
    try {
      const blob = base64ToBlob(item.base64, item.mime || "image/webp");
      const ingested = await ingestImage(blob);
      idMap.set(oldId, ingested.id);
    } catch (err) {
      console.warn(`Failed to import asset ${oldId}:`, err);
    }
  }

  return idMap;
}
