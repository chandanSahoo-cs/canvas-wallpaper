import { create } from "zustand";
import { getAsset } from "../assets/db";
import { getAssetObjectUrl } from "../assets/urls";
import { LightboxItem, LightboxState } from "./types";

let currentAbortId = 0;

export const useLightboxStore = create<LightboxState>((set, get) => {
  async function loadCurrentItemDetails(item: LightboxItem) {
    const abortId = ++currentAbortId;
    set({ isLoading: true, assetDetails: null });

    try {
      const [url, asset] = await Promise.all([
        getAssetObjectUrl(item.assetId),
        getAsset(item.assetId),
      ]);

      if (abortId === currentAbortId) {
        set({
          imageUrl: url,
          assetDetails: asset,
          isLoading: false,
        });
      }
    } catch (err) {
      console.warn("Failed to load lightbox asset details:", err);
      if (abortId === currentAbortId) {
        set({ isLoading: false });
      }
    }
  }

  return {
    isOpen: false,
    items: [],
    currentIndex: 0,
    assetDetails: null,
    imageUrl: null,
    isLoading: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    toastMessage: null,

    open: (items: LightboxItem[], startIndex = 0) => {
      if (!items || items.length === 0) return;
      const validIndex = Math.max(0, Math.min(items.length - 1, startIndex));
      const targetItem = items[validIndex];

      set({
        isOpen: true,
        items,
        currentIndex: validIndex,
        zoom: 1,
        pan: { x: 0, y: 0 },
        toastMessage: null,
      });

      loadCurrentItemDetails(targetItem);
    },

    close: () => {
      currentAbortId++;
      set({
        isOpen: false,
        items: [],
        currentIndex: 0,
        assetDetails: null,
        imageUrl: null,
        isLoading: false,
        zoom: 1,
        pan: { x: 0, y: 0 },
      });
    },

    next: () => {
      const { items, currentIndex } = get();
      if (items.length <= 1) return;
      const nextIndex = (currentIndex + 1) % items.length;
      set({
        currentIndex: nextIndex,
        zoom: 1,
        pan: { x: 0, y: 0 },
      });
      loadCurrentItemDetails(items[nextIndex]);
    },

    prev: () => {
      const { items, currentIndex } = get();
      if (items.length <= 1) return;
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      set({
        currentIndex: prevIndex,
        zoom: 1,
        pan: { x: 0, y: 0 },
      });
      loadCurrentItemDetails(items[prevIndex]);
    },

    setZoom: (zoom: number) => {
      set({ zoom: Math.max(0.25, Math.min(8, zoom)) });
    },

    setPan: (pan: { x: number; y: number }) => {
      set({ pan });
    },

    resetTransform: () => {
      set({ zoom: 1, pan: { x: 0, y: 0 } });
    },

    showToast: (msg: string) => {
      set({ toastMessage: msg });
      setTimeout(() => {
        if (get().toastMessage === msg) {
          set({ toastMessage: null });
        }
      }, 2500);
    },
  };
});
