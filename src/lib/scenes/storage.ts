import { BackgroundConfig, CanvasElement } from "../../elements/types";
import { Scene } from "../../store/useSceneStore";
import { getDefaultWallpaperElements } from "../defaultWallpaperPreset";

export const SCHEMA_VERSION = 3;
export const SCENE_INDEX_KEY = "scenes_index";
export const SCENE_KEY_PREFIX = "scene:";
export const INSTANT_PREVIEW_KEY = "papertab_active_scene_preview";
export const BG_COLOR_KEY = "papertab_bg_color";

export interface SceneIndexItem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ScenesIndex {
  schemaVersion: number;
  activeId: string;
  order: string[];
  items: Record<string, SceneIndexItem>;
  _sourceTab?: string;
  _updatedAt?: number;
}

export interface StoredSceneRecord {
  id: string;
  name: string;
  elements: CanvasElement[];
  background: BackgroundConfig;
  createdAt: number;
  updatedAt: number;
}

export async function getStorageItems<T>(keys: string[]): Promise<Record<string, T>> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (res) => {
        if (chrome.runtime?.lastError) {
          return reject(new Error(chrome.runtime.lastError.message || String(chrome.runtime.lastError)));
        }
        resolve((res as Record<string, T>) || {});
      });
    });
  }
  const result: Record<string, T> = {};
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw !== null) {
        result[k] = JSON.parse(raw);
      }
    } catch {}
  }
  return result;
}

export async function setStorageItems(items: Record<string, any>): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime?.lastError) {
          return reject(new Error(chrome.runtime.lastError.message || String(chrome.runtime.lastError)));
        }
        resolve();
      });
    });
  }
  for (const [k, v] of Object.entries(items)) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  }
}

export async function removeStorageItems(keys: string[]): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime?.lastError) {
          return reject(new Error(chrome.runtime.lastError.message || String(chrome.runtime.lastError)));
        }
        resolve();
      });
    });
  }
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }
}

export function writeInstantPreviewCache(activeScene: Scene): void {
  try {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "dark";
    const defaultColor = isDark ? "#0e1a1f" : "#f6faf8";
    const color = (activeScene.background?.color || defaultColor).toLowerCase();
    localStorage.setItem(BG_COLOR_KEY, color);
    localStorage.setItem(
      INSTANT_PREVIEW_KEY,
      JSON.stringify({
        activeId: activeScene.id,
        color,
        pattern: activeScene.background?.pattern || "none",
        type: activeScene.background?.type || "color",
      }),
    );
  } catch {}
}

export function createDefaultScene(): Scene {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";
  const defaultBgColor = isDark ? "#0e1a1f" : "#f6faf8";

  return {
    id: "default",
    name: "Wallpaper 1",
    elements: getDefaultWallpaperElements(),
    background: { type: "color", color: defaultBgColor },
    createdAt: Date.now(),
  };
}
