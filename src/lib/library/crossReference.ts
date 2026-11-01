import { getAllAssets } from "../assets/db";
import { hexDistanceOklab, hexToRgb, rgbToOklab } from "../assets/color";
import { hammingDistance } from "../assets/hash";
import { Scene, useSceneStore } from "../../store/useSceneStore";
import { ImageElement, TextElement } from "../../elements/types";
import { getInboxItems } from "../inbox/storage";
import { searchIndex, SearchDoc } from "../search/searchIndex";
import {
  BoardPlacement,
  LibraryFilters,
  LibraryItem,
  LibrarySortBy,
} from "./types";

/**
 * Calculates dominant color hue (0 to 360) for hue sorting.
 */
function getDominantHue(hex?: string): number {
  if (!hex) return 999;
  const rgb = hexToRgb(hex);
  if (!rgb) return 999;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 999; // Grayscale colors sort at the end
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

/**
 * Cross-references all IndexedDB assets and board elements across every scene.
 */
export async function loadAllLibraryItems(
  scenes?: Scene[],
): Promise<LibraryItem[]> {
  const allScenes = scenes || useSceneStore.getState().scenes;
  const assets = await getAllAssets();

  // 1. Build map of assetId -> BoardPlacement[]
  const placementMap = new Map<string, BoardPlacement[]>();
  const inboxItems = await getInboxItems();
  const inboxAssetMap = new Map<string, (typeof inboxItems)[0]>();
  for (const it of inboxItems) {
    if (it.assetId) inboxAssetMap.set(it.assetId, it);
  }

  for (const scene of allScenes) {
    if (scene.background?.type === "image" && scene.background.imageAssetId) {
      const aid = scene.background.imageAssetId;
      const list = placementMap.get(aid) || [];
      list.push({
        sceneId: scene.id,
        sceneName: scene.name,
        caption: "Wallpaper Background",
      });
      placementMap.set(aid, list);
    }

    for (const el of scene.elements) {
      if (el.type === "image") {
        const imgEl = el as ImageElement;
        if (imgEl.assetId) {
          const list = placementMap.get(imgEl.assetId) || [];
          list.push({
            sceneId: scene.id,
            sceneName: scene.name,
            elementId: imgEl.id,
            caption: imgEl.caption,
          });
          placementMap.set(imgEl.assetId, list);
        }
      }
    }
  }

  // 2. Build LibraryItem records for stored assets (images)
  const items: LibraryItem[] = assets.map((a) => {
    const placements = placementMap.get(a.id) || [];
    const inboxEntry = inboxAssetMap.get(a.id);
    return {
      id: a.id,
      type: "image",
      title: a.source?.title || a.source?.url?.split("/").pop() || "Untitled Image",
      createdAt: a.createdAt,
      assetId: a.id,
      thumbBlob: a.thumbBlob,
      width: a.width,
      height: a.height,
      bytes: a.bytes,
      mime: a.mime,
      tags: a.tags || [],
      note: a.note,
      palette: a.palette || [],
      phash: a.phash,
      labelColor: a.labelColor,
      sourceUrl: a.source?.url,
      placements,
      isInbox: Boolean(inboxEntry),
      inboxState: inboxEntry?.state,
      inboxId: inboxEntry?.id,
    };
  });

  // Collect non-asset Inbox items (links and text notes)
  for (const it of inboxItems) {
    if (!it.assetId) {
      items.push({
        id: `inbox-${it.id}`,
        type: "text",
        title: it.title || it.url || (it.text ? it.text.slice(0, 30) : "Inbox Item"),
        createdAt: it.createdAt,
        tags: ["inbox"],
        palette: [],
        sourceUrl: it.url || it.source?.url,
        textContent: it.text || it.url,
        placements: [],
        isInbox: true,
        inboxState: it.state,
        inboxId: it.id,
      });
    }
  }

  // 3. Collect Text Elements across all boards as searchable library items
  for (const scene of allScenes) {
    for (const el of scene.elements) {
      if (el.type === "text") {
        const textEl = el as TextElement;
        const textStr = (textEl.text || "").trim();
        if (!textStr) continue;
        items.push({
          id: `text-${scene.id}-${el.id}`,
          type: "text",
          title: textStr.length > 40 ? textStr.substring(0, 40) + "..." : textStr,
          createdAt: scene.createdAt || Date.now(),
          tags: [],
          palette: [],
          textContent: textStr,
          fontFamily: textEl.fontFamily,
          placements: [
            {
              sceneId: scene.id,
              sceneName: scene.name,
              elementId: el.id,
            },
          ],
        });
      }
    }
  }

    // Index all items in fast in-memory search index
  const searchDocs: SearchDoc[] = items.map((it) => ({
    id: it.id,
    type: it.type,
    title: it.title,
    tags: it.tags,
    note: it.note,
    captions: it.placements.map((p) => p.caption).filter(Boolean) as string[],
    sourceUrl: it.sourceUrl,
    boardNames: it.placements.map((p) => p.sceneName),
    textContent: it.textContent,
    createdAt: it.createdAt,
  }));
  searchIndex.rebuild(searchDocs);

  return items;
}

/**
 * Filter library items according to active filters.
 */
export function filterLibraryItems(
  items: LibraryItem[],
  filters: LibraryFilters,
): LibraryItem[] {
  let result = items;

  // Type filter
  if (filters.type && filters.type !== "all") {
    result = result.filter((it) => it.type === filters.type);
  }

  // Board filter
  if (filters.boardId) {
    result = result.filter((it) =>
      it.placements.some((p) => p.sceneId === filters.boardId),
    );
  }

  // Tag filter
  if (filters.tag) {
    result = result.filter((it) => it.tags.includes(filters.tag!));
  }

  // Unplaced only ("not on any board")
  if (filters.unplacedOnly) {
    result = result.filter((it) => it.placements.length === 0);
  }

  // Inbox only filter
  if (filters.inboxOnly) {
    result = result.filter((it) => it.isInbox && it.inboxState !== "dismissed");
  }

  // Date range filter
  if (filters.dateRange && filters.dateRange !== "all") {
    const now = Date.now();
    let cutoff = 0;
    if (filters.dateRange === "today") cutoff = now - 24 * 60 * 60 * 1000;
    else if (filters.dateRange === "week") cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (filters.dateRange === "month") cutoff = now - 30 * 24 * 60 * 60 * 1000;

    result = result.filter((it) => it.createdAt >= cutoff);
  }

  // Color filter (OKLab perceptual distance with tolerance)
  if (filters.colorHex) {
    const targetHex = filters.colorHex;
    const tolerance = filters.colorTolerance ?? 0.18;
    result = result.filter((it) => {
      if (it.type !== "image" || !it.palette || it.palette.length === 0) {
        return false;
      }
      return it.palette.some(
        (pal) => hexDistanceOklab(targetHex, pal.hex) <= tolerance,
      );
    });
  }

  // Duplicates filter (near duplicates with Hamming distance <= 5)
  if (filters.duplicatesOnly) {
    const imageItems = result.filter(
      (it) => it.type === "image" && it.phash && it.phash.length === 16,
    );
    const duplicateIds = new Set<string>();

    for (let i = 0; i < imageItems.length; i++) {
      for (let j = i + 1; j < imageItems.length; j++) {
        const itemA = imageItems[i];
        const itemB = imageItems[j];
        const dist = hammingDistance(itemA.phash!, itemB.phash!);
        if (dist <= 5) {
          duplicateIds.add(itemA.id);
          duplicateIds.add(itemB.id);
        }
      }
    }
    result = result.filter((it) => duplicateIds.has(it.id));
  }

  // Fast ranked full-text & prefix search via SearchIndex
  if (filters.query && filters.query.trim()) {
    if (searchIndex.size() === 0 && result.length > 0) {
      searchIndex.rebuild(
        result.map((it) => ({
          id: it.id,
          type: it.type,
          title: it.title,
          tags: it.tags,
          note: it.note,
          captions: it.placements.map((p) => p.caption).filter(Boolean) as string[],
          sourceUrl: it.sourceUrl,
          boardNames: it.placements.map((p) => p.sceneName),
          textContent: it.textContent,
          createdAt: it.createdAt,
        })),
      );
    }
    const searchResults = searchIndex.search(filters.query);
    const scoreMap = new Map(searchResults.map((r) => [r.id, r.score]));
    result = result.filter((it) => scoreMap.has(it.id));
    result.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
  }

  return result;
}

/**
 * Sort library items deterministically.
 */
export function sortLibraryItems(
  items: LibraryItem[],
  sortBy: LibrarySortBy,
): LibraryItem[] {
  const sorted = [...items];
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
    case "oldest":
      return sorted.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    case "size":
      return sorted.sort(
        (a, b) => (b.bytes || 0) - (a.bytes || 0) || b.createdAt - a.createdAt,
      );
    case "hue":
      return sorted.sort((a, b) => {
        const hueA = getDominantHue(a.palette?.[0]?.hex);
        const hueB = getDominantHue(b.palette?.[0]?.hex);
        return hueA - hueB || b.createdAt - a.createdAt;
      });
    default:
      return sorted;
  }
}
