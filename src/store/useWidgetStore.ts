import { create } from 'zustand';
import { newId } from '../lib/utils';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface WidgetSettings {
  showClock: boolean;
  clockFormat: '12h' | '24h';
  showDate: boolean;
  showSearch: boolean;
  searchEngine: 'google' | 'duckduckgo' | 'bing';
  showQuickLinks: boolean;
  quickLinks: QuickLink[];

  setShowClock: (show: boolean) => void;
  setClockFormat: (format: '12h' | '24h') => void;
  setShowDate: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setSearchEngine: (engine: 'google' | 'duckduckgo' | 'bing') => void;
  setShowQuickLinks: (show: boolean) => void;

  addQuickLink: (title: string, url: string) => void;
  removeQuickLink: (id: string) => void;
  updateQuickLink: (id: string, title: string, url: string) => void;

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
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    const newLink: QuickLink = {
      id: newId(),
      title: title.trim() || normalizedUrl.replace(/^https?:\/\/(www\.)?/i, ''),
      url: normalizedUrl,
    };
    set((state) => ({ quickLinks: [...state.quickLinks, newLink] }));
    get().saveToStorage();
  },

  removeQuickLink: (id) => {
    set((state) => ({ quickLinks: state.quickLinks.filter((l) => l.id !== id) }));
    get().saveToStorage();
  },

  updateQuickLink: (id, title, url) => {
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    set((state) => ({
      quickLinks: state.quickLinks.map((l) =>
        l.id === id ? { ...l, title: title.trim() || l.title, url: normalizedUrl } : l
      ),
    }));
    get().saveToStorage();
  },

  saveToStorage: () => {
    const { showClock, clockFormat, showDate, showSearch, searchEngine, showQuickLinks, quickLinks } = get();
    const data = { showClock, clockFormat, showDate, showSearch, searchEngine, showQuickLinks, quickLinks };
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
        set((state) => ({ ...state, ...data }));
      } catch (e) {}
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['wallpaperWidgets'], (res) => {
          if (res.wallpaperWidgets) apply(res.wallpaperWidgets);
        });
      } else {
        apply(localStorage.getItem('wallpaperWidgets'));
      }
    } catch (e) {
      console.error('Widget settings load error', e);
    }
  },
}));
