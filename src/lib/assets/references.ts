import { ImageElement, LinkElement } from "../../elements/types";
import { Scene } from "../../store/useSceneStore";
import { InboxItem } from "../inbox/types";

export function collectReferencedAssetIds(
  scenes: Scene[],
  inboxItems: InboxItem[],
): Set<string> {
  const referenced = new Set<string>();

  if (Array.isArray(scenes)) {
    for (const scene of scenes) {
      if (scene?.background?.type === "image" && scene.background.imageAssetId) {
        referenced.add(scene.background.imageAssetId);
      }
      if (Array.isArray(scene?.elements)) {
        for (const el of scene.elements) {
          if (!el) continue;
          if (el.type === "image" && (el as ImageElement).assetId) {
            referenced.add((el as ImageElement).assetId);
          } else if (el.type === "link") {
            const link = el as LinkElement;
            if (link.previewAssetId) {
              referenced.add(link.previewAssetId);
            }
            if (link.faviconAssetId) {
              referenced.add(link.faviconAssetId);
            }
          }
        }
      }
    }
  }

  if (Array.isArray(inboxItems)) {
    for (const item of inboxItems) {
      if (item?.assetId) {
        referenced.add(item.assetId);
      }
    }
  }

  return referenced;
}
