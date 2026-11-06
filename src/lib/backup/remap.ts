import { CanvasElement, ImageElement, LinkElement } from "../../elements/types";
import { Scene } from "../../store/useSceneStore";
import { InboxItem } from "../inbox/types";

function isMapEmpty(idMap: Map<string, string> | Record<string, string>): boolean {
  if (!idMap) return true;
  if (idMap instanceof Map) {
    return idMap.size === 0;
  }
  return Object.keys(idMap).length === 0;
}

function resolveMappedId(
  id: string,
  idMap: Map<string, string> | Record<string, string>,
): string;
function resolveMappedId(
  id: string | undefined,
  idMap: Map<string, string> | Record<string, string>,
): string | undefined;
function resolveMappedId(
  id: string | undefined,
  idMap: Map<string, string> | Record<string, string>,
): string | undefined {
  if (!id) return id;
  const mapped = idMap instanceof Map ? idMap.get(id) : idMap[id];
  return mapped || id;
}

/**
 * Pure function: rewrites image assetId, link previewAssetId/faviconAssetId,
 * and background.imageAssetId using the provided idMap.
 * Unmapped IDs are left unchanged. An empty map returns the input object unchanged.
 */
export function remapSceneAssetIds(
  scene: Scene,
  idMap: Map<string, string> | Record<string, string>,
): Scene {
  if (isMapEmpty(idMap) || !scene) {
    return scene;
  }

  let backgroundChanged = false;
  let newBackground = scene.background;
  if (scene.background?.type === "image" && scene.background.imageAssetId) {
    const mappedBg = resolveMappedId(scene.background.imageAssetId, idMap);
    if (mappedBg !== scene.background.imageAssetId) {
      backgroundChanged = true;
      newBackground = { ...scene.background, imageAssetId: mappedBg };
    }
  }

  let elementsChanged = false;
  const newElements: CanvasElement[] = (scene.elements || []).map((el): CanvasElement => {
    if (el.type === "image") {
      const img = el as ImageElement;
      const mapped = resolveMappedId(img.assetId, idMap);
      if (mapped !== img.assetId) {
        elementsChanged = true;
        return { ...img, assetId: mapped };
      }
    } else if (el.type === "link") {
      const link = el as LinkElement;
      const mappedPrev = resolveMappedId(link.previewAssetId, idMap);
      const mappedFav = resolveMappedId(link.faviconAssetId, idMap);
      if (mappedPrev !== link.previewAssetId || mappedFav !== link.faviconAssetId) {
        elementsChanged = true;
        return {
          ...link,
          previewAssetId: mappedPrev,
          faviconAssetId: mappedFav,
        };
      }
    }
    return el;
  });

  if (!backgroundChanged && !elementsChanged) {
    return scene;
  }

  return {
    ...scene,
    background: newBackground,
    elements: newElements,
  };
}

/**
 * Pure function: rewrites inbox item assetId using the provided idMap.
 * Unmapped IDs are left unchanged. An empty map returns the input object unchanged.
 */
export function remapInboxAssetIds(
  items: InboxItem[],
  idMap: Map<string, string> | Record<string, string>,
): InboxItem[] {
  if (isMapEmpty(idMap) || !Array.isArray(items)) {
    return items;
  }

  let anyChanged = false;
  const newItems = items.map((item) => {
    if (item.assetId) {
      const mapped = resolveMappedId(item.assetId, idMap);
      if (mapped !== item.assetId) {
        anyChanged = true;
        return { ...item, assetId: mapped };
      }
    }
    return item;
  });

  return anyChanged ? newItems : items;
}
