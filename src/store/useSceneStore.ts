import { create } from 'zustand';
import { CanvasElement, BackgroundConfig } from '../elements/types';
import { newId } from '../lib/utils';
import { useAppStore } from './useAppStore';

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
  createScene: (name?: string) => string;
  switchScene: (id: string) => void;
  deleteScene: (id: string) => void;
  renameScene: (id: string, name: string) => void;
  saveScenesToStorage: () => void;
  loadScenesFromStorage: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [
    {
      id: 'default',
      name: 'Wallpaper 1',
      elements: [],
      background: { type: 'color', color: '#14141a' },
      createdAt: Date.now(),
    },
  ],
  activeSceneId: 'default',

  createScene: (name) => {
    const id = newId();
    const existingNames = new Set(get().scenes.map((s) => s.name));
    let sceneNumber = get().scenes.length + 1;
    while (existingNames.has(`Wallpaper ${sceneNumber}`)) {
      sceneNumber++;
    }
    const newScene: Scene = {
      id,
      name: name || `Wallpaper ${sceneNumber}`,
      elements: [],
      background: { type: 'color', color: '#14141a' },
      createdAt: Date.now(),
    };
    set((state) => ({
      scenes: [...state.scenes, newScene],
      activeSceneId: id,
    }));
    useAppStore.getState().setElements([]);
    useAppStore.getState().setBackground({ type: 'color', color: '#14141a' });
    get().saveScenesToStorage();
    return id;
  },

  switchScene: (id) => {
    const { scenes, activeSceneId } = get();
    const appStore = useAppStore.getState();

    // Save current scene state before switching
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
    appStore.setElements(targetScene.elements);
    appStore.setBackground(targetScene.background);
    get().saveScenesToStorage();
  },

  deleteScene: (id) => {
    const { scenes, activeSceneId } = get();
    if (scenes.length <= 1) return; // Keep at least one scene
    const remaining = scenes.filter((s) => s.id !== id);
    const nextActiveId = activeSceneId === id ? remaining[0].id : activeSceneId;
    set({ scenes: remaining, activeSceneId: nextActiveId });

    if (activeSceneId === id) {
      const nextScene = remaining[0];
      useAppStore.getState().setElements(nextScene.elements);
      useAppStore.getState().setBackground(nextScene.background);
    }
    get().saveScenesToStorage();
  },

  renameScene: (id, name) => {
    set((state) => ({
      scenes: state.scenes.map((s) => (s.id === id ? { ...s, name } : s)),
    }));
    get().saveScenesToStorage();
  },

  saveScenesToStorage: () => {
    const { scenes, activeSceneId } = get();
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          wallpaperScenes: JSON.stringify(scenes),
          wallpaperActiveSceneId: activeSceneId,
        });
      } else {
        localStorage.setItem('wallpaperScenes', JSON.stringify(scenes));
        localStorage.setItem('wallpaperActiveSceneId', activeSceneId);
      }
    } catch (e) {
      console.error('Scenes save error', e);
    }
  },

  loadScenesFromStorage: () => {
    try {
      const sanitize = (raw: any): CanvasElement[] => {
        if (!Array.isArray(raw)) return [];
        return raw
          .filter((el) => el && typeof el === 'object' && typeof el.type === 'string')
          .map((el) => {
            if (el.type === 'text') {
              return {
                ...el,
                text: typeof el.text === 'string' ? el.text : '',
              };
            }
            return el;
          });
      };

      const applyScenes = (
        rawScenes: string | null,
        rawActiveId: string | null,
        rawFallbackElements: string | null,
        rawFallbackBg: string | null
      ) => {
        let scenes: Scene[] = [];
        if (rawScenes) {
          try {
            const parsedScenes = JSON.parse(rawScenes);
            if (Array.isArray(parsedScenes)) {
              scenes = parsedScenes.map((s: any) => ({
                ...s,
                elements: sanitize(s.elements),
              }));
            }
          } catch (e) {}
        }

        let fallbackElements: CanvasElement[] = [];
        if (rawFallbackElements) {
          try {
            fallbackElements = sanitize(JSON.parse(rawFallbackElements));
          } catch (e) {}
        }

        let fallbackBg: BackgroundConfig = { type: 'color', color: '#14141a' };
        if (rawFallbackBg) {
          try {
            const parsed = JSON.parse(rawFallbackBg);
            fallbackBg = typeof parsed === 'string' ? { type: 'color', color: parsed } : parsed;
          } catch (e) {
            fallbackBg = { type: 'color', color: rawFallbackBg };
          }
        }

        if (!Array.isArray(scenes) || scenes.length === 0) {
          scenes = [
            {
              id: 'default',
              name: 'Wallpaper 1',
              elements: fallbackElements,
              background: fallbackBg,
              createdAt: Date.now(),
            },
          ];
        }

        const activeId =
          rawActiveId && scenes.some((s) => s.id === rawActiveId) ? rawActiveId : scenes[0].id;
        set({ scenes, activeSceneId: activeId });

        const currentScene = scenes.find((s) => s.id === activeId) || scenes[0];
        let elementsToLoad = currentScene.elements;
        if ((!elementsToLoad || elementsToLoad.length === 0) && fallbackElements.length > 0) {
          elementsToLoad = fallbackElements;
          currentScene.elements = fallbackElements;
        }

        useAppStore.getState().setElements(elementsToLoad || []);
        useAppStore.getState().setBackground(currentScene.background || fallbackBg);
      };

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(
          ['wallpaperScenes', 'wallpaperActiveSceneId', 'wallpaperElements', 'wallpaperBackground'],
          (res: Record<string, any>) => {
            applyScenes(
              (res.wallpaperScenes as string) || null,
              (res.wallpaperActiveSceneId as string) || null,
              (res.wallpaperElements as string) || null,
              (res.wallpaperBackground as string) || null
            );
          }
        );
      } else {
        applyScenes(
          localStorage.getItem('wallpaperScenes'),
          localStorage.getItem('wallpaperActiveSceneId'),
          localStorage.getItem('wallpaperElements'),
          localStorage.getItem('wallpaperBackground')
        );
      }
    } catch (e) {
      console.error('Scenes load error', e);
    }
  },
}));

// Automatically sync any canvas element and background changes to the active scene & storage
let syncTimeout: any = null;
useAppStore.subscribe((state, prevState) => {
  if (state.elements !== prevState.elements || state.background !== prevState.background) {
    const sceneState = useSceneStore.getState();
    const updatedScenes = sceneState.scenes.map((s) =>
      s.id === sceneState.activeSceneId
        ? { ...s, elements: state.elements, background: state.background }
        : s
    );
    useSceneStore.setState({ scenes: updatedScenes });

    // Debounce disk save slightly so high-speed drawing doesn't thrash storage
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      sceneState.saveScenesToStorage();
      useAppStore.getState().saveToStorage();
    }, 150);
  }
});
