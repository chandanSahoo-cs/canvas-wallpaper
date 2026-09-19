import { create } from 'zustand';
import {
  CanvasElement,
  ToolType,
  Point,
  FillStyle,
  StrokeStyle,
  BackgroundConfig,
} from '../elements/types';
import { newId } from '../lib/utils';
import { getCenter, rotatePoint } from '../canvas/geometry';

export const HISTORY_LIMIT = 50;

export interface AppState {
  mode: 'wallpaper' | 'drawing';
  currentTool: ToolType;
  elements: CanvasElement[];
  selectedIds: Set<string>;
  draft: CanvasElement | null;

  // Camera / Zoom (detail magnification)
  zoom: number;
  scrollOffset: Point;

  // Background
  background: BackgroundConfig;

  // Current drawing styles
  currentStrokeColor: string;
  currentFillColor: string;
  currentFillStyle: FillStyle;
  currentStrokeWidth: number;
  currentStrokeStyle: StrokeStyle;
  currentRoughness: number;
  currentOpacity: number;

  // History for undo / redo
  history: CanvasElement[][];
  future: CanvasElement[][];

  // Actions
  setMode: (mode: 'wallpaper' | 'drawing') => void;
  setTool: (tool: ToolType) => void;
  setElements: (elements: CanvasElement[]) => void;
  setDraft: (draft: CanvasElement | null) => void;
  setSelectedIds: (ids: Set<string> | string[]) => void;
  toggleSelectedId: (id: string) => void;
  selectGroupMembers: (id: string, shiftKey: boolean) => void;

  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setScrollOffset: (offset: Point | ((prev: Point) => Point)) => void;
  resetZoom: () => void;

  setBackground: (bg: Partial<BackgroundConfig> | string) => void;
  setCurrentStyles: (styles: Partial<{
    strokeColor: string;
    fillColor: string;
    fillStyle: FillStyle;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    roughness: number;
    opacity: number;
  }>) => void;

  // Manipulation on selected
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateSelectedElements: (updates: Partial<CanvasElement>) => void;
  moveSelected: (snapshots: { id: string; snapshot: CanvasElement }[], dx: number, dy: number) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  toggleLockSelected: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  sendBackward: () => void;
  sendForward: () => void;
  clearCanvas: () => void;

  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'wallpaper',
  currentTool: 'selection',
  elements: [],
  selectedIds: new Set<string>(),
  draft: null,

  zoom: 1.0,
  scrollOffset: { x: 0, y: 0 },

  background: {
    type: 'color',
    color: '#14141a',
  },

  currentStrokeColor: '#1e1e1e',
  currentFillColor: 'transparent',
  currentFillStyle: 'solid',
  currentStrokeWidth: 1.5,
  currentStrokeStyle: 'solid',
  currentRoughness: 1.4,
  currentOpacity: 100,

  history: [],
  future: [],

  setMode: (mode) => {
    set({
      mode,
      draft: null,
      selectedIds: new Set(),
      currentTool: mode === 'drawing' ? 'selection' : 'selection',
    });
  },

  setTool: (tool) => {
    set({
      currentTool: tool,
      draft: null,
      selectedIds: tool === 'selection' ? get().selectedIds : new Set(),
    });
  },

  setElements: (elements) => set({ elements }),
  setDraft: (draft) => set({ draft }),

  setSelectedIds: (ids) => {
    set({ selectedIds: ids instanceof Set ? ids : new Set(ids) });
  },

  toggleSelectedId: (id) => {
    const next = new Set(get().selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedIds: next });
  },

  selectGroupMembers: (hitId, shiftKey) => {
    const { elements, selectedIds } = get();
    const hit = elements.find((e) => e.id === hitId);
    if (!hit) return;

    const gid = hit.groupIds && hit.groupIds.length ? hit.groupIds[hit.groupIds.length - 1] : null;
    const groupMembers = gid
      ? elements.filter((e) => e.groupIds && e.groupIds[e.groupIds.length - 1] === gid).map((e) => e.id)
      : [hitId];

    if (shiftKey) {
      const allIn = groupMembers.every((id) => selectedIds.has(id));
      const next = new Set(selectedIds);
      groupMembers.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
      set({ selectedIds: next });
    } else if (!selectedIds.has(hitId)) {
      set({ selectedIds: new Set(groupMembers) });
    }
  },

  setZoom: (zoomOrFn) => {
    const next = typeof zoomOrFn === 'function' ? zoomOrFn(get().zoom) : zoomOrFn;
    set({ zoom: Math.max(0.5, Math.min(5.0, next)) });
  },

  setScrollOffset: (offsetOrFn) => {
    const next = typeof offsetOrFn === 'function' ? offsetOrFn(get().scrollOffset) : offsetOrFn;
    set({ scrollOffset: next });
  },

  resetZoom: () => set({ zoom: 1.0, scrollOffset: { x: 0, y: 0 } }),

  setBackground: (bg) => {
    if (typeof bg === 'string') {
      set({ background: { type: 'color', color: bg } });
    } else {
      set({ background: { ...get().background, ...bg } });
    }
    get().saveToStorage();
  },

  setCurrentStyles: (styles) => {
    set((state) => ({
      currentStrokeColor: styles.strokeColor ?? state.currentStrokeColor,
      currentFillColor: styles.fillColor ?? state.currentFillColor,
      currentFillStyle: styles.fillStyle ?? state.currentFillStyle,
      currentStrokeWidth: styles.strokeWidth ?? state.currentStrokeWidth,
      currentStrokeStyle: styles.strokeStyle ?? state.currentStrokeStyle,
      currentRoughness: styles.roughness ?? state.currentRoughness,
      currentOpacity: styles.opacity ?? state.currentOpacity,
    }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } as CanvasElement : el)),
    }));
    get().saveToStorage();
  },

  updateSelectedElements: (updates) => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    set((state) => ({
      elements: state.elements.map((el) =>
        selectedIds.has(el.id) && !el.locked ? ({ ...el, ...updates } as CanvasElement) : el
      ),
    }));
    get().saveToStorage();
  },

  moveSelected: (snapshots, dx, dy) => {
    const snapMap = new Map(snapshots.map((s) => [s.id, s.snapshot]));
    set((state) => ({
      elements: state.elements.map((el) => {
        const snap = snapMap.get(el.id);
        if (!snap || el.locked) return el;
        if ('points' in snap && snap.points) {
          return {
            ...el,
            points: snap.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
          } as CanvasElement;
        } else if ('x' in snap && 'y' in snap) {
          return {
            ...el,
            x: snap.x + dx,
            y: snap.y + dy,
          } as CanvasElement;
        }
        return el;
      }),
    }));
  },

  deleteSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    set((state) => ({
      elements: state.elements.filter((el) => !(selectedIds.has(el.id) && !el.locked)),
      selectedIds: new Set([...selectedIds].filter((id) => state.elements.some((e) => e.id === id && e.locked))),
    }));
    get().saveToStorage();
  },

  duplicateSelected: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();

    const groupIdMap = new Map<string, string>();
    const newElements: CanvasElement[] = [];
    const newIds: string[] = [];

    elements.forEach((el) => {
      if (!selectedIds.has(el.id) || el.locked) return;
      const clone = JSON.parse(JSON.stringify(el)) as CanvasElement;
      clone.id = newId();
      if (clone.groupIds && clone.groupIds.length) {
        clone.groupIds = clone.groupIds.map((gid) => {
          if (!groupIdMap.has(gid)) groupIdMap.set(gid, newId());
          return groupIdMap.get(gid)!;
        });
      }
      if ('points' in clone && clone.points) {
        clone.points = clone.points.map((p) => ({ x: p.x + 12, y: p.y + 12 })) as [Point, Point] & Point[];
      } else if ('x' in clone && 'y' in clone) {
        clone.x += 12;
        clone.y += 12;
      }
      newElements.push(clone);
      newIds.push(clone.id);
    });

    set((state) => ({
      elements: [...state.elements, ...newElements],
      selectedIds: new Set(newIds),
    }));
    get().saveToStorage();
  },

  toggleLockSelected: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    const shouldLock = elements.some((el) => selectedIds.has(el.id) && !el.locked);
    set((state) => ({
      elements: state.elements.map((el) =>
        selectedIds.has(el.id) ? { ...el, locked: shouldLock } : el
      ),
    }));
    get().saveToStorage();
  },

  groupSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.size < 2) return;
    get().pushHistory();
    const gid = newId();
    set((state) => ({
      elements: state.elements.map((el) => {
        if (!selectedIds.has(el.id)) return el;
        return {
          ...el,
          groupIds: [...(el.groupIds || []), gid],
        };
      }),
    }));
    get().saveToStorage();
  },

  ungroupSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    set((state) => ({
      elements: state.elements.map((el) => {
        if (!selectedIds.has(el.id) || !el.groupIds || el.groupIds.length === 0) return el;
        return {
          ...el,
          groupIds: el.groupIds.slice(0, -1),
        };
      }),
    }));
    get().saveToStorage();
  },

  sendBackward: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    set((state) => {
      const els = [...state.elements];
      for (let i = 1; i < els.length; i++) {
        if (selectedIds.has(els[i].id) && !selectedIds.has(els[i - 1].id)) {
          const temp = els[i];
          els[i] = els[i - 1];
          els[i - 1] = temp;
        }
      }
      return { elements: els };
    });
    get().saveToStorage();
  },

  sendForward: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    set((state) => {
      const els = [...state.elements];
      for (let i = els.length - 2; i >= 0; i--) {
        if (selectedIds.has(els[i].id) && !selectedIds.has(els[i + 1].id)) {
          const temp = els[i];
          els[i] = els[i + 1];
          els[i + 1] = temp;
        }
      }
      return { elements: els };
    });
    get().saveToStorage();
  },

  clearCanvas: () => {
    get().pushHistory();
    set({ elements: [], selectedIds: new Set(), draft: null });
    get().saveToStorage();
  },

  pushHistory: () => {
    const snap = JSON.parse(JSON.stringify(get().elements));
    set((state) => {
      const history = [...state.history, snap];
      if (history.length > HISTORY_LIMIT) history.shift();
      return { history, future: [] };
    });
  },

  undo: () => {
    const { history, elements } = get();
    if (history.length === 0) return;
    const current = JSON.parse(JSON.stringify(elements));
    const previous = history[history.length - 1];
    set((state) => ({
      elements: previous,
      history: state.history.slice(0, -1),
      future: [current, ...state.future],
      selectedIds: new Set(),
    }));
    get().saveToStorage();
  },

  redo: () => {
    const { future, elements } = get();
    if (future.length === 0) return;
    const current = JSON.parse(JSON.stringify(elements));
    const next = future[0];
    set((state) => ({
      elements: next,
      future: state.future.slice(1),
      history: [...state.history, current],
      selectedIds: new Set(),
    }));
    get().saveToStorage();
  },

  saveToStorage: () => {
    const { elements, background } = get();
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          wallpaperElements: JSON.stringify(elements),
          wallpaperBackground: JSON.stringify(background),
        });
      } else {
        localStorage.setItem('wallpaperElements', JSON.stringify(elements));
        localStorage.setItem('wallpaperBackground', JSON.stringify(background));
      }
    } catch (e) {
      console.error('Storage save error', e);
    }
  },

  loadFromStorage: () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['wallpaperElements', 'wallpaperBackground'], (result) => {
          if (result.wallpaperElements) {
            try {
              set({ elements: JSON.parse(result.wallpaperElements) });
            } catch (e) {}
          }
          if (result.wallpaperBackground) {
            try {
              const bg = JSON.parse(result.wallpaperBackground);
              set({ background: typeof bg === 'string' ? { type: 'color', color: bg } : bg });
            } catch (e) {
              set({ background: { type: 'color', color: result.wallpaperBackground } });
            }
          }
        });
      } else {
        const rawEl = localStorage.getItem('wallpaperElements');
        if (rawEl) set({ elements: JSON.parse(rawEl) });
        const rawBg = localStorage.getItem('wallpaperBackground');
        if (rawBg) {
          try {
            const bg = JSON.parse(rawBg);
            set({ background: typeof bg === 'string' ? { type: 'color', color: bg } : bg });
          } catch (e) {
            set({ background: { type: 'color', color: rawBg } });
          }
        }
      }
    } catch (e) {
      console.error('Storage load error', e);
    }
  },
}));
