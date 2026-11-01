import { create } from "zustand";
import { getAssetObjectUrl } from "../assets/urls";
import { useAppStore } from "../../store/useAppStore";
import { Scene, useSceneStore } from "../../store/useSceneStore";
import { getInboxItems } from "../inbox/storage";
import {
  buildResurfaceIndex,
  getResurfaceConfig,
  getResurfaceIndex,
  saveResurfaceConfig,
  selectResurfacePick,
} from "./storage";
import {
  ResurfaceConfig,
  ResurfaceFit,
  ResurfaceIndex,
  ResurfaceMode,
  ResurfacePick,
} from "./types";

interface ResurfaceState {
  config: ResurfaceConfig;
  index: ResurfaceIndex;
  currentPick: ResurfacePick;
  itemImageUrl: string | null;
  feedbackMessage: string | null;

  // Actions
  showAnother: () => void;
  pinThis: () => void;
  neverShowAgain: () => void;
  setMode: (mode: ResurfaceMode) => void;
  setFit: (fit: ResurfaceFit) => void;
  setShowCaption: (show: boolean) => void;
  removeExclusion: (id: string) => void;
  clearExclusions: () => void;
  syncFromScenes: (scenes: Scene[]) => Promise<void>;
  clearFeedback: () => void;
}

// Synchronously initialize state at file load to guarantee zero flash
const initialConfig = getResurfaceConfig();
const initialIndex = getResurfaceIndex();
const initialActiveSceneId =
  useSceneStore.getState().activeSceneId || "default";

const initialPick = selectResurfacePick(
  initialConfig,
  initialIndex,
  initialActiveSceneId,
);

// If an item or board was picked, record lastShownId to prevent immediate repeat on next tab
if (initialPick.id) {
  initialConfig.lastShownId = initialPick.id;
  saveResurfaceConfig(initialConfig);
}

export const useResurfaceStore = create<ResurfaceState>((set, get) => {
  // If an initial item pick exists, load its display image in background
  if (initialPick.type === "item" && initialPick.item?.assetId) {
    getAssetObjectUrl(initialPick.item.assetId).then((url) => {
      if (url) set({ itemImageUrl: url });
    });
  }

  return {
    config: initialConfig,
    index: initialIndex,
    currentPick: initialPick,
    itemImageUrl: null,
    feedbackMessage: null,

    showAnother: () => {
      const { config, index } = get();
      const activeSceneId = useSceneStore.getState().activeSceneId || "default";

      // Pick next candidate avoiding current pick
      const nextConfig = { ...config, lastShownId: get().currentPick.id };
      const nextPick = selectResurfacePick(nextConfig, index, activeSceneId);

      nextConfig.lastShownId = nextPick.id;
      saveResurfaceConfig(nextConfig);

      set({
        config: nextConfig,
        currentPick: nextPick,
        itemImageUrl: null,
      });

      if (nextPick.type === "item" && nextPick.item?.assetId) {
        getAssetObjectUrl(nextPick.item.assetId).then((url) => {
          if (url && get().currentPick.id === nextPick.id) {
            set({ itemImageUrl: url });
          }
        });
      }
    },

    pinThis: () => {
      const { currentPick } = get();
      if (currentPick.type === "board" && currentPick.boardId) {
        useSceneStore.getState().switchScene(currentPick.boardId);
        set({ feedbackMessage: "Pinned as active board" });
        setTimeout(() => set({ feedbackMessage: null }), 2500);
      } else if (currentPick.type === "item" && currentPick.item?.assetId) {
        useAppStore.getState().setBackground({
          type: "image",
          imageAssetId: currentPick.item.assetId,
          color: useAppStore.getState().background.color,
        });
        useAppStore.getState().saveToStorage();
        set({ feedbackMessage: "Pinned as wallpaper background" });
        setTimeout(() => set({ feedbackMessage: null }), 2500);
      }
    },

    neverShowAgain: () => {
      const { config, currentPick } = get();
      const targetId = currentPick.item?.assetId || currentPick.id;
      if (!targetId) return;

      const updatedExclusions = Array.from(
        new Set([...config.exclusions, targetId]),
      );
      const nextConfig = { ...config, exclusions: updatedExclusions };
      saveResurfaceConfig(nextConfig);
      set({ config: nextConfig });

      // Automatically advance to another item
      get().showAnother();
    },

    setMode: (mode: ResurfaceMode) => {
      const nextConfig = { ...get().config, mode };
      saveResurfaceConfig(nextConfig);
      set({ config: nextConfig });
      get().showAnother();
    },

    setFit: (fit: ResurfaceFit) => {
      const nextConfig = { ...get().config, fit };
      saveResurfaceConfig(nextConfig);
      set({ config: nextConfig });
    },

    setShowCaption: (showCaption: boolean) => {
      const nextConfig = { ...get().config, showCaption };
      saveResurfaceConfig(nextConfig);
      set({ config: nextConfig });
    },

    removeExclusion: (id: string) => {
      const nextConfig = {
        ...get().config,
        exclusions: get().config.exclusions.filter((x) => x !== id),
      };
      saveResurfaceConfig(nextConfig);
      set({ config: nextConfig });
    },

    clearExclusions: () => {
      const nextConfig = { ...get().config, exclusions: [] };
      saveResurfaceConfig(nextConfig);
      set({ config: nextConfig });
    },

    syncFromScenes: async (scenes: Scene[]) => {
      try {
        const inbox = await getInboxItems();
        const nextIndex = buildResurfaceIndex(scenes, inbox);
        set({ index: nextIndex });
      } catch (err) {
        console.warn("Failed to sync resurface index:", err);
      }
    },

    clearFeedback: () => set({ feedbackMessage: null }),
  };
});
