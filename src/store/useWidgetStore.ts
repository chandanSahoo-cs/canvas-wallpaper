import { create } from 'zustand';
import { newId, sanitizeWebUrl } from '../lib/utils';

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
  clockFormat: '12h' | '24h';
  showDate: boolean;
  showSearch: boolean;
  searchEngine: 'google' | 'duckduckgo' | 'bing' | 'brave';
  showQuickLinks: boolean;
  quickLinks: QuickLink[];

  // Free-form layout positions
  widgetPositions: WidgetPositions;
  isLayoutMode: boolean;

  setShowClock: (show: boolean) => void;
  setClockFormat: (format: '12h' | '24h') => void;
  setShowDate: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setSearchEngine: (engine: 'google' | 'duckduckgo' | 'bing' | 'brave') => void;
  setShowQuickLinks: (show: boolean) => void;

  addQuickLink: (title: string, url: string) => void;
  removeQuickLink: (id: string) => void;
  updateQuickLink: (id: string, title: string, url: string) => void;

  setWidgetPosition: (widget: keyof WidgetPositions, pos: WidgetPosition) => void;
  setAllWidgetPositions: (positions: WidgetPositions) => void;
  resetWidgetPositions: () => void;
  setIsLayoutMode: (enabled: boolean) => void;

  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com' },
  { id: '3', title: 'Reddit', url: 'https://reddit.com' },
  { id: '4', title: 'X', url: 'https://x.com' },
];

export const useWidgetStore = create<WidgetSettings>((set, get) => ({
  showClock: true,
  clockFormat: '12h',
  showDate: true,
  showSearch: true,
  searchEngine: 'google',
  showQuickLinks: true,
  quickLinks: DEFAULT_QUICK_LINKS,

  widgetPositions: DEFAULT_WIDGET_POSITIONS,
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

  addQuickLink: (title, url) => {
    if (get().quickLinks.length >= MAX_QUICK_LINKS) return;
    const validUrl = sanitizeWebUrl(url);
    if (!validUrl) return;
    const newLink: QuickLink = {
      id: newId(),
      title: title.trim() || validUrl.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''),
      url: validUrl,
    };
    set((state) => ({ quickLinks: [...state.quickLinks, newLink] }));
    get().saveToStorage();
  },

  removeQuickLink: (id) => {
    set((state) => ({ quickLinks: state.quickLinks.filter((l) => l.id !== id) }));
    get().saveToStorage();
  },

  updateQuickLink: (id, title, url) => {
    const validUrl = sanitizeWebUrl(url);
    if (!validUrl) return;
    set((state) => ({
      quickLinks: state.quickLinks.map((l) =>
        l.id === id ? { ...l, title: title.trim() || l.title, url: validUrl } : l
      ),
    }));
    get().saveToStorage();
  },

  setWidgetPosition: (widget, pos) => {
    // Clamp coordinates safely within [5, 95] to prevent off-screen loss
    const clampedX = Math.min(95, Math.max(5, Math.round(pos.x * 10) / 10));
    const clampedY = Math.min(95, Math.max(5, Math.round(pos.y * 10) / 10));

    set((state) => ({
      widgetPositions: {
        ...state.widgetPositions,
        [widget]: { x: clampedX, y: clampedY },
      },
    }));
    get().saveToStorage();
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
    };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ wallpaperWidgets: JSON.stringify(data) });
      } else {
        localStorage.setItem('wallpaperWidgets', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Widget settings save error', e);
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
              title: String(l.title || 'Link'),
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

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['wallpaperWidgets'], (res: Record<string, any>) => {
          if (res.wallpaperWidgets) apply(res.wallpaperWidgets as string);
        });
      } else {
        apply(localStorage.getItem('wallpaperWidgets'));
      }
    } catch (e) {
      console.error('Widget settings load error', e);
    }
  },
}));
