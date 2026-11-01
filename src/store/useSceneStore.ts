import { create } from "zustand";
import { CanvasElement, BackgroundConfig } from "../elements/types";
import { newId } from "../lib/utils";
import { WallpaperPreset } from "../lib/wallpaperPresets";
import { useAppStore } from "./useAppStore";
import {
  getDefaultWallpaperElements,
  isDefaultPresetAtOriginalPosition,
  shiftElements,
  ORIGINAL_PRESET_CENTER,
} from "../lib/defaultWallpaperPreset";
import {
  createDefaultScene,
  getStorageItems,
  removeStorageItems,
  SCHEMA_VERSION,
  SCENE_INDEX_KEY,
  SCENE_KEY_PREFIX,
  ScenesIndex,
  setStorageItems,
  writeInstantPreviewCache,
} from "../lib/scenes/storage";

export interface Scene {
  id: string;
  name: string;
  elements: CanvasElement[];
  background: BackgroundConfig;
  createdAt: number;
}

export interface SceneState {
  scenes: Scene[];
  activeSceneId: string;
  createScene: (
    name?: string,
    initialElements?: CanvasElement[],
    initialBackground?: BackgroundConfig,
  ) => string;
  applyPresetToActiveScene: (preset: WallpaperPreset) => void;
  switchScene: (id: string) => void;
  deleteScene: (id: string) => void;
  renameScene: (id: string, name: string) => void;
  saveScenesToStorage: () => Promise<void>;
  loadScenesFromStorage: (options?: { isCrossTabSync?: boolean }) => Promise<void>;
  resetAllScenes: () => Promise<void>;
}

export const MAX_SCENES = 100;

const tabSessionId =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

let lastLocalSaveTime = 0;
let isHydrating = false;
let syncTimeout: any = null;

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [createDefaultScene()],
  activeSceneId: "default",

  createScene: (name, initialElements, initialBackground) => {
    if (get().scenes.length >= MAX_SCENES) {
      return get().activeSceneId;
    }
    const { scenes, activeSceneId } = get();
    const appStore = useAppStore.getState();

    // Preserve current active scene state before switching
    const updatedScenes = scenes.map((s) => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          elements: appStore.elements,
          background: appStore.background,
        };
      }
      return s;
    });

    const id = newId();
    const existingNames = new Set(updatedScenes.map((s) => s.name));
    let sceneNumber = updatedScenes.length + 1;
    while (existingNames.has(`Wallpaper ${sceneNumber}`)) {
      sceneNumber++;
    }

    const elements = initialElements
      ? JSON.parse(JSON.stringify(initialElements))
      : [];
    const background: BackgroundConfig = initialBackground
      ? { ...initialBackground }
      : createDefaultScene().background;

    const newScene: Scene = {
      id,
      name: name || `Wallpaper ${sceneNumber}`,
      elements,
      background,
      createdAt: Date.now(),
    };

    set({
      scenes: [...updatedScenes, newScene],
      activeSceneId: id,
    });

    appStore.resetHistory();
    appStore.setElements(elements);
    appStore.setBackground(background);
    get().saveScenesToStorage();
    return id;
  },

  applyPresetToActiveScene: (preset) => {
    const appStore = useAppStore.getState();
    const w = typeof window !== "undefined" ? window.innerWidth : 1440;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    const elements = preset.getElements(w, h);

    appStore.pushHistory();
    appStore.setElements(elements);
    appStore.setBackground(preset.background);

    const { scenes, activeSceneId } = get();
    const updatedScenes = scenes.map((s) => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          elements,
          background: preset.background,
        };
      }
      return s;
    });

    set({ scenes: updatedScenes });
    get().saveScenesToStorage();
  },

  switchScene: (id) => {
    const { scenes, activeSceneId } = get();
    const appStore = useAppStore.getState();

    // Save current active scene state before switching
    const updatedScenes = scenes.map((s) => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          elements: appStore.elements,
          background: appStore.background,
        };
      }
      return s;
    });

    const targetScene = updatedScenes.find((s) => s.id === id);
    if (!targetScene) return;

    set({ scenes: updatedScenes, activeSceneId: id });
    appStore.resetHistory();
    appStore.setElements(targetScene.elements);
    appStore.setBackground(targetScene.background);
    get().saveScenesToStorage();
  },

  deleteScene: (id) => {
    const { scenes, activeSceneId } = get();
    if (scenes.length <= 1) return; // Retain at least one scene

    const remaining = scenes.filter((s) => s.id !== id);
    const nextActiveId = activeSceneId === id ? remaining[0].id : activeSceneId;
    set({ scenes: remaining, activeSceneId: nextActiveId });

    if (activeSceneId === id) {
      const nextScene = remaining[0];
      const appStore = useAppStore.getState();
      appStore.resetHistory();
      appStore.setElements(nextScene.elements);
      appStore.setBackground(nextScene.background);
    }

    // Remove the deleted scene's key directly from storage
    removeStorageItems([SCENE_KEY_PREFIX + id]).catch(() => {});
    get().saveScenesToStorage();
  },

  renameScene: (id, name) => {
    set((state) => ({
      scenes: state.scenes.map((s) => (s.id === id ? { ...s, name } : s)),
    }));
    get().saveScenesToStorage();
  },

  /**
   * Scalable Per-Scene Storage Save:
   * Writes the scenes index and only the active scene's data.
   * Other scenes are untouched.
   */
  saveScenesToStorage: async () => {
    const { scenes, activeSceneId } = get();
    lastLocalSaveTime = Date.now();

    try {
      const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

      // Instant-paint synchronous cache
      writeInstantPreviewCache(activeScene);

      // Construct compact scene index
      const index: ScenesIndex = {
        schemaVersion: SCHEMA_VERSION,
        activeId: activeSceneId,
        order: scenes.map((s) => s.id),
        items: Object.fromEntries(
          scenes.map((s) => [
            s.id,
            {
              id: s.id,
              name: s.name,
              createdAt: s.createdAt,
              updatedAt: Date.now(),
            },
          ]),
        ),
        _sourceTab: tabSessionId,
        _updatedAt: Date.now(),
      };

      // Atomic write of index + active scene only
      await setStorageItems({
        [SCENE_INDEX_KEY]: index,
        [SCENE_KEY_PREFIX + activeScene.id]: activeScene,
      });
    } catch (err) {
      console.error("Scenes save error:", err);
    }
  },

  /**
   * Loads scenes from per-scene storage keys with schema validation and one-time reset.
   */
  loadScenesFromStorage: async (options?: { isCrossTabSync?: boolean }) => {
    isHydrating = true;
    try {
      const sanitize = (raw: any): CanvasElement[] => {
        if (!Array.isArray(raw)) return [];
        return raw.filter(
          (el) => el && typeof el === "object" && typeof el.type === "string",
        );
      };

      const storage = await getStorageItems<any>([
        SCENE_INDEX_KEY,
        "wallpaperScenes",
      ]);

      const index = storage[SCENE_INDEX_KEY] as ScenesIndex | undefined;

      // Schema mismatch or first run: perform one-time local reset
      if (!index || index.schemaVersion !== SCHEMA_VERSION || !Array.isArray(index.order)) {
        console.info("Initializing scene storage with schema v" + SCHEMA_VERSION);
        const defaultScene = createDefaultScene();
        set({ scenes: [defaultScene], activeSceneId: defaultScene.id });
        useAppStore.getState().setElements(defaultScene.elements);
        useAppStore.getState().setBackground(defaultScene.background);
        await get().saveScenesToStorage();
        return;
      }

      // Fetch all scenes by their discrete keys
      const sceneKeys = index.order.map((id) => SCENE_KEY_PREFIX + id);
      const sceneRecords = await getStorageItems<any>(sceneKeys);

      const loadedScenes: Scene[] = [];
      for (const id of index.order) {
        const raw = sceneRecords[SCENE_KEY_PREFIX + id];
        const indexMeta = index.items[id];
        if (raw && typeof raw === "object") {
          loadedScenes.push({
            id: raw.id || id,
            name: raw.name || indexMeta?.name || `Wallpaper`,
            elements: sanitize(raw.elements),
            background: raw.background || createDefaultScene().background,
            createdAt: raw.createdAt || indexMeta?.createdAt || Date.now(),
          });
        } else if (indexMeta) {
          loadedScenes.push({
            id,
            name: indexMeta.name || "Wallpaper",
            elements: [],
            background: createDefaultScene().background,
            createdAt: indexMeta.createdAt || Date.now(),
          });
        }
      }

      const scenes = loadedScenes.length > 0 ? loadedScenes : [createDefaultScene()];
      const activeId = scenes.some((s) => s.id === index.activeId)
        ? index.activeId
        : scenes[0].id;

      const prevActiveId = get().activeSceneId;
      if (activeId !== prevActiveId) {
        useAppStore.getState().resetHistory();
      }

      set({ scenes, activeSceneId: activeId });

      const currentScene = scenes.find((s) => s.id === activeId) || scenes[0];
      let elementsToLoad = currentScene.elements;

      // Auto-center default preset on new/different machines if at original author coordinates
      if (!options?.isCrossTabSync && isDefaultPresetAtOriginalPosition(elementsToLoad)) {
        const targetW =
          typeof window !== "undefined" && window.innerWidth > 0
            ? window.innerWidth
            : 1466;
        const targetH =
          typeof window !== "undefined" && window.innerHeight > 0
            ? window.innerHeight
            : 748;
        const dx = targetW / 2 - ORIGINAL_PRESET_CENTER.x;
        const dy = targetH / 2 - ORIGINAL_PRESET_CENTER.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          elementsToLoad = shiftElements(elementsToLoad, dx, dy);
          currentScene.elements = elementsToLoad;
          set({
            scenes: scenes.map((s) =>
              s.id === currentScene.id ? { ...s, elements: elementsToLoad } : s,
            ),
          });
          get().saveScenesToStorage();
        }
      }

      isHydrating = true;
      const appStore = useAppStore.getState();
      const validSelected = new Set(
        [...appStore.selectedIds].filter((id) =>
          elementsToLoad.some((el) => el.id === id),
        ),
      );
      appStore.setSelectedIds(validSelected);
      appStore.setElements(elementsToLoad);
      appStore.setBackground(currentScene.background);

      writeInstantPreviewCache(currentScene);

      setTimeout(() => {
        isHydrating = false;
      }, 50);
    } catch (err) {
      console.error("Scenes load error:", err);
      isHydrating = false;
    }
  },

  /**
   * Resets all scenes to initial default (scenes only; does not delete assets).
   */
  resetAllScenes: async () => {
    const { scenes } = get();
    const keysToRemove = [
      SCENE_INDEX_KEY,
      "wallpaperScenes",
      "wallpaperActiveSceneId",
      ...scenes.map((s) => SCENE_KEY_PREFIX + s.id),
    ];
    await removeStorageItems(keysToRemove);
    const defaultScene = createDefaultScene();
    set({ scenes: [defaultScene], activeSceneId: defaultScene.id });
    useAppStore.getState().resetHistory();
    useAppStore.getState().setElements(defaultScene.elements);
    useAppStore.getState().setBackground(defaultScene.background);
    await get().saveScenesToStorage();
  },
}));

// Cross-tab synchronization via chrome.storage.onChanged
if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    // Ignore storage writes initiated by this specific tab
    const indexChange = changes[SCENE_INDEX_KEY];
    const newIndex = indexChange?.newValue as ScenesIndex | undefined;
    if (newIndex?._sourceTab === tabSessionId) {
      return;
    }

    if (Date.now() - lastLocalSaveTime < 250) return;

    const activeId = useSceneStore.getState().activeSceneId;
    if (changes[SCENE_INDEX_KEY] || changes[SCENE_KEY_PREFIX + activeId]) {
      useSceneStore.getState().loadScenesFromStorage({ isCrossTabSync: true });
    }
  });
}

// Automatically sync active canvas element and background changes to the active scene & storage
useAppStore.subscribe((state, prevState) => {
  if (isHydrating) return;
  const elementsChanged = state.elements !== prevState.elements;
  const bgChanged = state.background !== prevState.background;

  if (elementsChanged || bgChanged) {
    const sceneState = useSceneStore.getState();
    const updatedScenes = sceneState.scenes.map((s) =>
      s.id === sceneState.activeSceneId
        ? { ...s, elements: state.elements, background: state.background }
        : s,
    );
    useSceneStore.setState({ scenes: updatedScenes });

    // Background changes save quickly (50ms) to ensure persistence; element edits debounce (400ms)
    clearTimeout(syncTimeout);
    const delay = bgChanged && !elementsChanged ? 50 : 400;
    syncTimeout = setTimeout(() => {
      useSceneStore.getState().saveScenesToStorage();
      syncTimeout = null;
    }, delay);
  }
});

// Flush any pending debounced writes on beforeunload, pagehide, and visibilitychange
if (typeof window !== "undefined") {
  const flushSync = () => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
      useSceneStore.getState().saveScenesToStorage();
    }
  };

  window.addEventListener("beforeunload", flushSync);
  window.addEventListener("pagehide", flushSync);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSync();
    }
  });
}
