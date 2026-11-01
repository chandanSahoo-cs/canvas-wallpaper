import { Scene } from "../../store/useSceneStore";
import { ImageElement } from "../../elements/types";
import { InboxItem } from "../inbox/types";
import {
  ResurfaceConfig,
  ResurfaceIndex,
  ResurfaceItem,
  ResurfacePick,
  RESURFACE_CONFIG_KEY,
  RESURFACE_INDEX_KEY,
} from "./types";

export const DEFAULT_RESURFACE_CONFIG: ResurfaceConfig = {
  mode: "current",
  fit: "cover",
  showCaption: true,
  exclusions: [],
};

export const DEFAULT_RESURFACE_INDEX: ResurfaceIndex = {
  boardIds: [],
  boardNames: {},
  items: [],
  updatedAt: 0,
};

/**
 * Synchronously reads the resurfacing user config from localStorage.
 */
export function getResurfaceConfig(): ResurfaceConfig {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(RESURFACE_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_RESURFACE_CONFIG,
          ...parsed,
          exclusions: Array.isArray(parsed.exclusions) ? parsed.exclusions : [],
        };
      }
    }
  } catch {}
  return { ...DEFAULT_RESURFACE_CONFIG };
}

/**
 * Synchronously writes the resurfacing user config to localStorage.
 */
export function saveResurfaceConfig(config: ResurfaceConfig): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(RESURFACE_CONFIG_KEY, JSON.stringify(config));
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [RESURFACE_CONFIG_KEY]: config });
    }
  } catch {}
}

/**
 * Synchronously reads the compact resurfacing index from localStorage.
 */
export function getResurfaceIndex(): ResurfaceIndex {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(RESURFACE_INDEX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          boardIds: Array.isArray(parsed.boardIds) ? parsed.boardIds : [],
          boardNames: parsed.boardNames || {},
          items: Array.isArray(parsed.items) ? parsed.items : [],
          updatedAt: parsed.updatedAt || 0,
        };
      }
    }
  } catch {}
  return { ...DEFAULT_RESURFACE_INDEX };
}

/**
 * Synchronously writes the compact resurfacing index to localStorage.
 */
export function saveResurfaceIndex(index: ResurfaceIndex): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(RESURFACE_INDEX_KEY, JSON.stringify(index));
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [RESURFACE_INDEX_KEY]: index });
    }
  } catch {}
}

/**
 * Builds a compact, fast-to-deserialize index of all boards and images
 * across scenes and saves it to localStorage.
 */
export function buildResurfaceIndex(
  scenes: Scene[],
  inboxItems?: InboxItem[],
): ResurfaceIndex {
  const boardIds: string[] = [];
  const boardNames: Record<string, string> = {};
  const itemMap = new Map<string, ResurfaceItem>();

  for (const scene of scenes) {
    boardIds.push(scene.id);
    boardNames[scene.id] = scene.name;

    // Check background image
    if (scene.background?.type === "image" && scene.background.imageAssetId) {
      const aid = scene.background.imageAssetId;
      if (!itemMap.has(aid)) {
        itemMap.set(aid, {
          id: `bg-${scene.id}-${aid}`,
          assetId: aid,
          title: `${scene.name} Background`,
          caption: "Wallpaper background",
        });
      }
    }

    // Check scene elements
    for (const el of scene.elements) {
      if (el.type === "image") {
        const img = el as ImageElement;
        if (img.assetId && !itemMap.has(img.assetId)) {
          itemMap.set(img.assetId, {
            id: img.id,
            assetId: img.assetId,
            title: img.caption || "Saved Image",
            caption: img.caption,
            sourceUrl: img.sourceUrl,
            width: img.width,
            height: img.height,
          });
        }
      }
    }
  }

  // Include image items from inbox
  if (Array.isArray(inboxItems)) {
    for (const it of inboxItems) {
      if (it.kind === "image" && it.assetId && !itemMap.has(it.assetId)) {
        itemMap.set(it.assetId, {
          id: it.id,
          assetId: it.assetId,
          title: it.title || "Inbox Image",
          sourceUrl: it.source?.url,
          sourceTitle: it.source?.title,
        });
      }
    }
  }

  const index: ResurfaceIndex = {
    boardIds,
    boardNames,
    items: Array.from(itemMap.values()),
    updatedAt: Date.now(),
  };

  saveResurfaceIndex(index);
  return index;
}

/**
 * Generates a stable deterministic integer hash for daily picks.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Synchronously selects what to resurface on tab load based on the configuration.
 */
export function selectResurfacePick(
  config: ResurfaceConfig,
  index: ResurfaceIndex,
  activeSceneId: string,
): ResurfacePick {
  const { mode, exclusions = [], lastShownId } = config;

  // 1. Current Board mode (Default)
  if (mode === "current") {
    return {
      mode: "current",
      type: "board",
      id: activeSceneId,
      boardId: activeSceneId,
    };
  }

  // 2. Shuffle Boards mode
  if (mode === "shuffle") {
    const candidateBoards = (index.boardIds.length > 0
      ? index.boardIds
      : [activeSceneId]
    ).filter((id) => !exclusions.includes(id));

    if (candidateBoards.length === 0) {
      return {
        mode: "shuffle",
        type: "board",
        id: activeSceneId,
        boardId: activeSceneId,
      };
    }

    // Avoid immediate repeat if more than 1 candidate exists
    const pool =
      candidateBoards.length > 1 && lastShownId
        ? candidateBoards.filter((id) => id !== lastShownId)
        : candidateBoards;

    const chosenId =
      pool[Math.floor(Math.random() * pool.length)] || candidateBoards[0];

    return {
      mode: "shuffle",
      type: "board",
      id: chosenId,
      boardId: chosenId,
    };
  }

  // 3. Random Item mode
  if (mode === "random_item") {
    const candidateItems = index.items.filter(
      (it) => !exclusions.includes(it.id) && !exclusions.includes(it.assetId),
    );

    if (candidateItems.length === 0) {
      // Fall back to current board if no images exist
      return {
        mode: "random_item",
        type: "board",
        id: activeSceneId,
        boardId: activeSceneId,
      };
    }

    const pool =
      candidateItems.length > 1 && lastShownId
        ? candidateItems.filter((it) => it.id !== lastShownId && it.assetId !== lastShownId)
        : candidateItems;

    const chosen =
      pool[Math.floor(Math.random() * pool.length)] || candidateItems[0];

    return {
      mode: "random_item",
      type: "item",
      id: chosen.id,
      item: chosen,
    };
  }

  // 4. Daily Pick mode (Deterministic based on local date YYYY-MM-DD)
  if (mode === "daily") {
    const candidateItems = index.items.filter(
      (it) => !exclusions.includes(it.id) && !exclusions.includes(it.assetId),
    );

    if (candidateItems.length === 0) {
      return {
        mode: "daily",
        type: "board",
        id: activeSceneId,
        boardId: activeSceneId,
      };
    }

    const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    const hash = hashString(todayStr);
    const chosen = candidateItems[hash % candidateItems.length];

    return {
      mode: "daily",
      type: "item",
      id: chosen.id,
      item: chosen,
    };
  }

  return {
    mode: "current",
    type: "board",
    id: activeSceneId,
    boardId: activeSceneId,
  };
}
