import { ImageElement } from "../elements/types";
import { newId, randomSeed } from "./utils";
import { useAppStore } from "../store/useAppStore";
import { ingestImage } from "./assets";

/**
 * Ingests an image File into the IndexedDB asset store and places an ImageElement
 * onto the active canvas board.
 */
export async function insertImageFromFile(file: File): Promise<boolean> {
  if (!file) return false;

  try {
    const asset = await ingestImage(file, {
      title: file.name,
      savedAt: Date.now(),
    });

    const store = useAppStore.getState();
    const maxW = Math.min(500, window.innerWidth * 0.7);
    const maxH = Math.min(400, window.innerHeight * 0.7);
    const scale = Math.min(maxW / asset.width, maxH / asset.height, 1);
    const w = Math.max(20, Math.round(asset.width * scale));
    const h = Math.max(20, Math.round(asset.height * scale));

    // Center within current zoomed/panned canvas viewport
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    const cx = Math.round(
      screenCenterX / store.zoom + store.scrollOffset.x - w / 2,
    );
    const cy = Math.round(
      screenCenterY / store.zoom + store.scrollOffset.y - h / 2,
    );

    const imageEl: ImageElement = {
      id: newId(),
      type: "image",
      angle: 0,
      locked: false,
      groupIds: [],
      x: cx,
      y: cy,
      width: w,
      height: h,
      assetId: asset.id,
      caption: file.name.replace(/\.[^/.]+$/, ""),
      strokeColor: "#1e1e1e",
      fillColor: "transparent",
      strokeWidth: 1.5,
      opacity: 100,
      seed: randomSeed(),
    };

    store.pushHistory();
    store.setElements([...store.elements, imageEl]);
    store.setSelectedIds(new Set([imageEl.id]));
    store.setTool("selection");
    store.saveToStorage();
    return true;
  } catch (err: any) {
    console.warn("Failed to insert image:", err);
    alert(err?.message || "Failed to import image.");
    return false;
  }
}
