import { create } from "zustand";
import { newId, sanitizeWebUrl } from "../lib/utils";

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface WidgetPosition {
  x: number; // 0 to 100 (% of viewport width)
  y: number; // 0 to 100 (% of viewport height)
}

export interface WidgetPositions {
  clock: WidgetPosition;
  search: WidgetPosition;
  quickLinks: WidgetPosition;
}

export const DEFAULT_WIDGET_POSITIONS: WidgetPositions = {
  clock: { x: 50, y: 38 },
  search: { x: 50, y: 52 },
  quickLinks: { x: 50, y: 64 },
};

export const MAX_QUICK_LINKS = 10;

export interface WidgetSettings {
  showClock: boolean;
  clockFormat: "12h" | "24h";
  showDate: boolean;
  showSearch: boolean;
  searchEngine: "google" | "duckduckgo" | "bing" | "brave";
  showQuickLinks: boolean;
  quickLinks: QuickLink[];

  // Free-form layout positions
  widgetPositions: WidgetPositions;
  isLayoutMode: boolean;

  setShowClock: (show: boolean) => void;
  setClockFormat: (format: "12h" | "24h") => void;
  setShowDate: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setSearchEngine: (engine: "google" | "duckduckgo" | "bing" | "brave") => void;
  setShowQuickLinks: (show: boolean) => void;

  turnOffAllWidgets: () => void;
  turnOnAllWidgets: () => void;
  toggleAllWidgets: (enabled: boolean) => void;
  lastEnabledWidgets?: {
    showClock: boolean;
    showDate: boolean;
    showSearch: boolean;
    showQuickLinks: boolean;
  };

  addQuickLink: (title: string, url: string) => void;
  removeQuickLink: (id: string) => void;
  updateQuickLink: (id: string, title: string, url: string) => void;

  setWidgetPosition: (
    widget: keyof WidgetPositions,
    pos: WidgetPosition,
    shouldSave?: boolean,
  ) => void;
  setAllWidgetPositions: (positions: WidgetPositions) => void;
  resetWidgetPositions: () => void;
  setIsLayoutMode: (enabled: boolean) => void;

  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: "1", title: "GitHub", url: "https://github.com" },
  { id: "2", title: "YouTube", url: "https://youtube.com" },
  { id: "3", title: "Reddit", url: "https://reddit.com" },
  { id: "4", title: "X", url: "https://x.com" },
];

let lastWidgetLocalSaveTime = 0;

function getInitialWidgetState() {
  const defaults = {
    showClock: true,
    clockFormat: "12h" as const,
    showDate: true,
    showSearch: true,
    searchEngine: "google" as const,
    showQuickLinks: true,
    quickLinks: DEFAULT_QUICK_LINKS,
    widgetPositions: DEFAULT_WIDGET_POSITIONS,
    lastEnabledWidgets: undefined as
      | { clock: boolean; search: boolean; quickLinks: boolean }
      | undefined,
  };

  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("wallpaperWidgets")
        : null;
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.quickLinks)) {
        data.quickLinks = data.quickLinks
          .map((l: any) => ({
            id: String(l.id || newId()),
            title: String(l.title || "Link"),
            url: sanitizeWebUrl(l.url),
          }))
          .filter((l: any) => Boolean(l.url))
          .slice(0, MAX_QUICK_LINKS);
      }
      return {
        showClock:
          typeof data.showClock === "boolean"
            ? data.showClock
            : defaults.showClock,
        clockFormat:
          data.clockFormat === "24h" ? ("24h" as const) : defaults.clockFormat,
        showDate:
          typeof data.showDate === "boolean"
            ? data.showDate
            : defaults.showDate,
        showSearch:
          typeof data.showSearch === "boolean"
            ? data.showSearch
            : defaults.showSearch,
        searchEngine: data.searchEngine || defaults.searchEngine,
        showQuickLinks:
          typeof data.showQuickLinks === "boolean"
            ? data.showQuickLinks
            : defaults.showQuickLinks,
        quickLinks: Array.isArray(data.quickLinks)
          ? data.quickLinks
          : defaults.quickLinks,
        widgetPositions: {
          ...DEFAULT_WIDGET_POSITIONS,
          ...(data.widgetPositions || {}),
        },
        lastEnabledWidgets: data.lastEnabledWidgets,
      };
    }
  } catch (e) {}

  return defaults;
}

const initialWidgetState = getInitialWidgetState();

export const useWidgetStore = create<WidgetSettings>((set, get) => ({
  ...initialWidgetState,
  isLayoutMode: false,

  setShowClock: (show) => {
    set({ showClock: show });
    get().saveToStorage();
  },

  setClockFormat: (format) => {
    set({ clockFormat: format });
    get().saveToStorage();
  },

  setShowDate: (show) => {
    set({ showDate: show });
    get().saveToStorage();
  },

  setShowSearch: (show) => {
    set({ showSearch: show });
    get().saveToStorage();
  },

  setSearchEngine: (engine) => {
    set({ searchEngine: engine });
    get().saveToStorage();
  },

  setShowQuickLinks: (show) => {
    set({ showQuickLinks: show });
    get().saveToStorage();
  },

  turnOffAllWidgets: () => {
    const { showClock, showDate, showSearch, showQuickLinks } = get();
    const hasAnyOn = showClock || showDate || showSearch || showQuickLinks;
    set({
      ...(hasAnyOn
        ? {
            lastEnabledWidgets: {
              showClock,
              showDate,
              showSearch,
              showQuickLinks,
            },
          }
        : {}),
      showClock: false,
      showDate: false,
      showSearch: false,
      showQuickLinks: false,
    });
    get().saveToStorage();
  },

  turnOnAllWidgets: () => {
    const { lastEnabledWidgets } = get();
    if (
      lastEnabledWidgets &&
      (lastEnabledWidgets.showClock ||
        lastEnabledWidgets.showDate ||
        lastEnabledWidgets.showSearch ||
        lastEnabledWidgets.showQuickLinks)
    ) {
      set({
        showClock: lastEnabledWidgets.showClock,
        showDate: lastEnabledWidgets.showDate,
        showSearch: lastEnabledWidgets.showSearch,
        showQuickLinks: lastEnabledWidgets.showQuickLinks,
      });
    } else {
      set({
        showClock: true,
        showDate: true,
        showSearch: true,
        showQuickLinks: true,
      });
    }
    get().saveToStorage();
  },

  toggleAllWidgets: (enabled) => {
    if (enabled) {
      get().turnOnAllWidgets();
    } else {
      get().turnOffAllWidgets();
    }
  },

  addQuickLink: (title, url) => {
    if (get().quickLinks.length >= MAX_QUICK_LINKS) return;
    const validUrl = sanitizeWebUrl(url);
    if (!validUrl) return;
    const newLink: QuickLink = {
      id: newId(),
      title:
        title.trim() ||
        validUrl.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""),
      url: validUrl,
    };
    set((state) => ({ quickLinks: [...state.quickLinks, newLink] }));
    get().saveToStorage();
  },

  removeQuickLink: (id) => {
    set((state) => ({
      quickLinks: state.quickLinks.filter((l) => l.id !== id),
    }));
    get().saveToStorage();
  },

  updateQuickLink: (id, title, url) => {
    const validUrl = sanitizeWebUrl(url);
    if (!validUrl) return;
    set((state) => ({
      quickLinks: state.quickLinks.map((l) =>
        l.id === id
          ? { ...l, title: title.trim() || l.title, url: validUrl }
          : l,
      ),
    }));
    get().saveToStorage();
  },

  setWidgetPosition: (widget, pos, shouldSave = true) => {
    // Clamp coordinates safely within [5, 95] to prevent off-screen loss
    const clampedX = Math.min(95, Math.max(5, Math.round(pos.x * 10) / 10));
    const clampedY = Math.min(95, Math.max(5, Math.round(pos.y * 10) / 10));

    set((state) => ({
      widgetPositions: {
        ...state.widgetPositions,
        [widget]: { x: clampedX, y: clampedY },
      },
    }));
    if (shouldSave) {
      get().saveToStorage();
    }
  },

  setAllWidgetPositions: (positions) => {
    set({ widgetPositions: positions });
    get().saveToStorage();
  },

  resetWidgetPositions: () => {
    set({ widgetPositions: DEFAULT_WIDGET_POSITIONS });
    get().saveToStorage();
  },

  setIsLayoutMode: (enabled) => {
    set({ isLayoutMode: enabled });
  },

  saveToStorage: () => {
    const {
      showClock,
      clockFormat,
      showDate,
      showSearch,
      searchEngine,
      showQuickLinks,
      quickLinks,
      widgetPositions,
    } = get();
    const data = {
      showClock,
      clockFormat,
      showDate,
      showSearch,
      searchEngine,
      showQuickLinks,
      quickLinks,
      widgetPositions,
      lastEnabledWidgets: get().lastEnabledWidgets,
    };
    lastWidgetLocalSaveTime = Date.now();
    try {
      const serialized = JSON.stringify(data);
      // Synchronously write to localStorage for instant, zero-flicker new tab rendering
      try {
        localStorage.setItem("wallpaperWidgets", serialized);
      } catch (e) {}

      // Asynchronously persist to chrome.storage.local
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.set({ wallpaperWidgets: serialized });
      }
    } catch (e) {
      console.error("Widget settings save error", e);
    }
  },

  loadFromStorage: () => {
    const apply = (raw: string | null) => {
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data.quickLinks)) {
          data.quickLinks = data.quickLinks
            .map((l: any) => ({
              id: String(l.id || newId()),
              title: String(l.title || "Link"),
              url: sanitizeWebUrl(l.url),
            }))
            .filter((l: any) => Boolean(l.url))
            .slice(0, MAX_QUICK_LINKS);
        }
        set((state) => ({
          ...state,
          ...data,
          widgetPositions: {
            ...DEFAULT_WIDGET_POSITIONS,
            ...(data.widgetPositions || {}),
          },
        }));
      } catch (e) {}
    };

    // 1. Immediately apply any synchronous localStorage cache
    try {
      const localRaw =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("wallpaperWidgets")
          : null;
      if (localRaw) apply(localRaw);
    } catch (e) {}

    // 2. Fetch from chrome.storage.local to reconcile across tabs / browser profiles
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.get(
          ["wallpaperWidgets"],
          (res: Record<string, any>) => {
            if (res.wallpaperWidgets) {
              apply(res.wallpaperWidgets as string);
              try {
                localStorage.setItem(
                  "wallpaperWidgets",
                  res.wallpaperWidgets as string,
                );
              } catch (e) {}
            }
          },
        );
      }
    } catch (e) {
      console.error("Widget settings load error", e);
    }
  },
}));

// Cross-tab synchronization for widget settings
if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    // Ignore storage change notifications originated by this tab's own recent save
    if (Date.now() - lastWidgetLocalSaveTime < 350) return;
    if (changes.wallpaperWidgets) {
      useWidgetStore.getState().loadFromStorage();
    }
  });
}

// Preload storage as early as possible on module execution
try {
  useWidgetStore.getState().loadFromStorage();
} catch (e) {}
