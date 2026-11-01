import { create } from "zustand";
import {
  addInboxItem,
  deleteInboxItem,
  dismissInboxItem,
  getInboxCaptureHint,
  getInboxItems,
  setInboxCaptureHint,
  undoDismissInboxItem,
  updateBadgeCount,
} from "./storage";
import { InboxItem, InboxItemState, INBOX_STORAGE_KEY, INBOX_TICK_KEY } from "./types";
import { sanitizePlainText, sanitizeTitle, validateHttpUrl } from "./validation";
import { placeInboxItemOnBoard, placeInboxItemsAsGrid } from "./placement";

interface InboxStoreState {
  items: InboxItem[];
  unreadCount: number;
  isOpen: boolean;
  filterState: "all" | "new" | "placed" | "dismissed";
  hasHint: boolean;
  lastDismissed: InboxItem | null;

  loadItems: () => Promise<void>;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setFilterState: (filter: "all" | "new" | "placed" | "dismissed") => void;

  quickAdd: (rawText: string) => Promise<InboxItem | null>;
  dismiss: (id: string) => Promise<void>;
  undoDismiss: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  placeItem: (item: InboxItem, pos?: { x: number; y: number }) => Promise<void>;
  placeAllAsGrid: () => Promise<void>;
  clearHint: () => Promise<void>;
}

export const useInboxStore = create<InboxStoreState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isOpen: false,
  filterState: "all",
  hasHint: false,
  lastDismissed: null,

  loadItems: async () => {
    const items = await getInboxItems();
    const unreadCount = items.filter((it) => it.state === "new").length;
    const hasHint = await getInboxCaptureHint();
    set({ items, unreadCount, hasHint });
    await updateBadgeCount(unreadCount);
  },

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setFilterState: (filterState) => set({ filterState }),

  quickAdd: async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return null;

    let newItem: InboxItem;
    if (validateHttpUrl(trimmed)) {
      newItem = await addInboxItem({
        kind: "link",
        url: trimmed,
        title: sanitizeTitle(trimmed.replace(/^https?:\/\//i, "")),
        source: {
          url: trimmed,
          savedAt: Date.now(),
        },
      });
    } else {
      const sanitized = sanitizePlainText(trimmed);
      newItem = await addInboxItem({
        kind: "text",
        text: sanitized,
        title: sanitizeTitle(sanitized.slice(0, 40)),
        source: {
          savedAt: Date.now(),
        },
      });
    }

    await get().loadItems();
    return newItem;
  },

  dismiss: async (id: string) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;

    await dismissInboxItem(id);
    set({ lastDismissed: item });
    await get().loadItems();
  },

  undoDismiss: async () => {
    const last = get().lastDismissed;
    if (!last) return;

    await undoDismissInboxItem(last.id);
    set({ lastDismissed: null });
    await get().loadItems();
  },

  deleteItem: async (id: string) => {
    await deleteInboxItem(id);
    await get().loadItems();
  },

  placeItem: async (item: InboxItem, pos?: { x: number; y: number }) => {
    await placeInboxItemOnBoard(item, pos);
    await get().loadItems();
  },

  placeAllAsGrid: async () => {
    const activeItems = get().items.filter(
      (it) => it.state === "new" || it.state === "placed",
    );
    // Prefer placing items that are not yet dismissed
    if (activeItems.length === 0) return;
    await placeInboxItemsAsGrid(activeItems);
    await get().loadItems();
  },

  clearHint: async () => {
    await setInboxCaptureHint(false);
    set({ hasHint: false });
  },
}));

// Initialize reactive listeners across tabs and service worker
if (typeof window !== "undefined") {
  // Initial load
  useInboxStore.getState().loadItems();

  // 1. Chrome storage changes listener
  if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (
        areaName === "local" &&
        (changes[INBOX_STORAGE_KEY] || changes[INBOX_TICK_KEY])
      ) {
        useInboxStore.getState().loadItems();
      }
    });
  }

  // 2. Runtime messaging listener
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "INBOX_UPDATED") {
        useInboxStore.getState().loadItems();
      }
    });
  }

  // 3. Fallback localStorage listener
  window.addEventListener("storage", (e) => {
    if (e.key === INBOX_STORAGE_KEY || e.key === INBOX_TICK_KEY) {
      useInboxStore.getState().loadItems();
    }
  });
}
