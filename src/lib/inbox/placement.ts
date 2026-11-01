import { getAsset } from "../assets/db";
import {
  CanvasElement,
  ImageElement,
  LinkElement,
  TextElement,
} from "../../elements/types";
import { useAppStore } from "../../store/useAppStore";
import { updateInboxItemState } from "./storage";
import { InboxItem } from "./types";
import { enrichLinkElementOnBoard } from "./ogResolver";

/**
 * Returns current center of the user's viewport in canvas coordinates.
 */
export function getViewportCenter(): { x: number; y: number } {
  const { zoom, scrollOffset } = useAppStore.getState();
  const width = typeof window !== "undefined" ? window.innerWidth : 1200;
  const height = typeof window !== "undefined" ? window.innerHeight : 800;
  return {
    x: Math.round(width / (2 * zoom) + scrollOffset.x),
    y: Math.round(height / (2 * zoom) + scrollOffset.y),
  };
}

export function createLinkElement(
  url: string,
  title?: string,
  posX: number = 0,
  posY: number = 0,
): LinkElement {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = url;
  }

  const width = 280;
  const height = 80;
  const seed = Math.floor(Math.random() * 2 ** 31);

  return {
    id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: "link",
    x: Math.round(posX - width / 2),
    y: Math.round(posY - height / 2),
    width,
    height,
    url,
    title: title || domain || "Web Link",
    domain,
    strokeColor: "#0E1A1F",
    fillColor: "#FFFFFF",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1.2,
    opacity: 100,
    locked: false,
    seed,
  };
}

/**
 * Creates a CanvasElement from an InboxItem.
 */
export async function createBoardElementFromInboxItem(
  item: InboxItem,
  posX: number,
  posY: number,
): Promise<CanvasElement | null> {
  const seed = Math.floor(Math.random() * 2 ** 31);

  if (item.kind === "image" && item.assetId) {
    const asset = await getAsset(item.assetId);
    let displayW = 320;
    let displayH = 240;

    if (asset && asset.width > 0 && asset.height > 0) {
      const aspect = asset.width / asset.height;
      if (aspect >= 1) {
        displayW = Math.min(asset.width, 360);
        displayH = Math.round(displayW / aspect);
      } else {
        displayH = Math.min(asset.height, 360);
        displayW = Math.round(displayH * aspect);
      }
    }

    const imgEl: ImageElement = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: "image",
      assetId: item.assetId,
      x: Math.round(posX - displayW / 2),
      y: Math.round(posY - displayH / 2),
      width: displayW,
      height: displayH,
      caption: item.title || asset?.source?.title || "",
      showCaption: false,
      sourceUrl: item.url || item.source?.url,
      strokeColor: "#0E1A1F",
      fillColor: "transparent",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      locked: false,
      seed,
    };
    return imgEl;
  }

  if (item.kind === "text") {
    let content = (item.text || "").trim();
    if (item.source?.title || item.source?.url) {
      const sourceLine = item.source.title || item.source.url;
      content = `"${content}"\n\n— ${sourceLine}`;
    }

    const textEl: TextElement = {
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: "text",
      x: Math.round(posX - 140),
      y: Math.round(posY - 40),
      text: content,
      fontSize: 20,
      fontFamily: "handwritten",
      strokeColor: "#0E1A1F",
      fillColor: "transparent",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      locked: false,
      seed,
    };
    return textEl;
  }

  if (item.kind === "link") {
    const linkEl = createLinkElement(
      item.url || "https://papertab.app",
      item.title,
      posX,
      posY,
    );
    // Best-effort OpenGraph enrichment in background
    setTimeout(() => {
      enrichLinkElementOnBoard(linkEl.id);
    }, 100);
    return linkEl;
  }

  return null;
}

/**
 * Places a single Inbox item onto the active board and marks it as placed.
 */
export async function placeInboxItemOnBoard(
  item: InboxItem,
  pos?: { x: number; y: number },
): Promise<CanvasElement | null> {
  const targetPos = pos || getViewportCenter();
  const el = await createBoardElementFromInboxItem(
    item,
    targetPos.x,
    targetPos.y,
  );
  if (!el) return null;

  const appState = useAppStore.getState();
  appState.pushHistory();
  appState.setElements([...appState.elements, el]);
  appState.setSelectedIds(new Set([el.id]));
  appState.setTool("selection");
  if (appState.mode === "wallpaper") {
    appState.setMode("drawing");
  }

  // Update active scene in store
  appState.saveToStorage();

  // Mark item state as placed
  await updateInboxItemState(item.id, "placed");
  return el;
}

/**
 * Places multiple Inbox items as a tidy grid centered on the viewport.
 */
export async function placeInboxItemsAsGrid(
  items: InboxItem[],
): Promise<CanvasElement[]> {
  if (items.length === 0) return [];

  const center = getViewportCenter();
  const cols = Math.ceil(Math.sqrt(items.length));
  const cardW = 320;
  const cardH = 240;
  const gap = 24;

  const totalGridW = cols * cardW + (cols - 1) * gap;
  const rows = Math.ceil(items.length / cols);
  const totalGridH = rows * cardH + (rows - 1) * gap;

  const startX = center.x - totalGridW / 2 + cardW / 2;
  const startY = center.y - totalGridH / 2 + cardH / 2;

  const createdElements: CanvasElement[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const posX = startX + col * (cardW + gap);
    const posY = startY + row * (cardH + gap);

    const el = await createBoardElementFromInboxItem(item, posX, posY);
    if (el) {
      createdElements.push(el);
      await updateInboxItemState(item.id, "placed");
    }
  }

  if (createdElements.length > 0) {
    const appState = useAppStore.getState();
    appState.pushHistory();
    const updatedElements = [...appState.elements, ...createdElements];
    appState.setElements(updatedElements);
    appState.setSelectedIds(new Set(createdElements.map((e) => e.id)));
    appState.setTool("selection");
    if (appState.mode === "wallpaper") {
      appState.setMode("drawing");
    }

    appState.saveToStorage();
  }

  return createdElements;
}
