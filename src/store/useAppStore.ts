import { create } from 'zustand';
import {
  CanvasElement,
  ToolType,
  Point,
  FillStyle,
  StrokeStyle,
  BackgroundConfig,
  FontFamily,
} from '../elements/types';
import { newId, isColorLight, randomSeed } from '../lib/utils';
import { getCenter, rotatePoint } from '../canvas/geometry';
import { getConnectedGroupElementIds, groupElements, ungroupElements } from '../lib/groups';
import { getDefaultWallpaperElements } from '../lib/defaultWallpaperPreset';

export const HISTORY_LIMIT = 50;

export interface TextEditorState {
  elementId: string | null;
  canvasX: number;
  canvasY: number;
  text: string;
  fontSize: number;
  fontFamily?: FontFamily;
  strokeColor: string;
  angle?: number;
}

export interface AppState {
  mode: 'wallpaper' | 'drawing';
  currentTool: ToolType;
  elements: CanvasElement[];
  selectedIds: Set<string>;
  draft: CanvasElement | null;
  editingText: TextEditorState | null;
  isPreviewing: boolean;

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
  currentFontFamily: FontFamily;

  // History for undo / redo
  history: CanvasElement[][];
  future: CanvasElement[][];

  // Actions
  setMode: (mode: 'wallpaper' | 'drawing') => void;
  togglePreview: () => void;
  setTool: (tool: ToolType) => void;
  setElements: (elements: CanvasElement[]) => void;
  setDraft: (draft: CanvasElement | null) => void;
  setEditingText: (editingText: TextEditorState | null) => void;
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
    fontFamily: FontFamily;
  }>) => void;

  // Manipulation on selected
  updateElement: (id: string, updates: Partial<CanvasElement>, shouldSave?: boolean) => void;
  updateSelectedElements: (updates: Partial<CanvasElement>) => void;
  moveSelected: (snapshots: { id: string; snapshot: CanvasElement }[], dx: number, dy: number) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: (elementsToPaste?: CanvasElement[]) => void;
  clipboard: CanvasElement[];
  toggleLockSelected: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  sendBackward: () => void;
  sendForward: () => void;
  clearCanvas: () => void;

  // History actions
  pushHistory: () => void;
  resetHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

let pasteOffsetMultiplier = 1;

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'wallpaper',
  currentTool: 'selection',
  elements: getDefaultWallpaperElements(),
  selectedIds: new Set<string>(),
  clipboard: [],
  draft: null,
  editingText: null,
  isPreviewing: false,

  zoom: 1.0,
  scrollOffset: { x: 0, y: 0 },

  background: {
    type: 'color',
    color: '#14141a',
  },

  currentStrokeColor: '#ffffff',
  currentFillColor: 'transparent',
  currentFillStyle: 'solid',
  currentStrokeWidth: 1.5,
  currentStrokeStyle: 'solid',
  currentRoughness: 1.4,
  currentOpacity: 100,
  currentFontFamily: 'handwritten',

  history: [],
  future: [],

  setMode: (mode) => {
    set({
      mode,
      draft: null,
      selectedIds: new Set(),
      isPreviewing: false,
      currentTool: mode === 'drawing' ? 'selection' : 'selection',
    });
  },

  togglePreview: () => set((state) => ({ isPreviewing: !state.isPreviewing })),

  setTool: (tool) => {
    set({
      currentTool: tool,
      draft: null,
      selectedIds: tool === 'selection' ? get().selectedIds : new Set(),
    });
  },

  setElements: (elements) => set({ elements }),
  setDraft: (draft) => set({ draft }),
  setEditingText: (editingText) => set({ editingText }),

  setSelectedIds: (ids) => {
    const raw = ids instanceof Set ? ids : new Set(ids);
    const { elements } = get();
    const next = getConnectedGroupElementIds(elements, raw);
    const firstSelected = elements.find((e) => next.has(e.id));
    if (firstSelected) {
      set({
        selectedIds: next,
        currentStrokeColor: firstSelected.strokeColor ?? get().currentStrokeColor,
        currentFillColor: firstSelected.fillColor ?? get().currentFillColor,
        currentStrokeWidth: firstSelected.strokeWidth ?? get().currentStrokeWidth,
        currentStrokeStyle: firstSelected.strokeStyle ?? get().currentStrokeStyle,
        currentFillStyle: firstSelected.fillStyle ?? get().currentFillStyle,
        currentRoughness: firstSelected.roughness ?? get().currentRoughness,
        currentOpacity: firstSelected.opacity ?? get().currentOpacity,
        currentFontFamily: (firstSelected as any).fontFamily ?? get().currentFontFamily,
      });
    } else {
      set({ selectedIds: next });
    }
  },

  toggleSelectedId: (id) => {
    const { elements, selectedIds } = get();
    const groupMemberIds = getConnectedGroupElementIds(elements, [id]);
    const allIn = Array.from(groupMemberIds).every((gid) => selectedIds.has(gid));
    const next = new Set(selectedIds);
    groupMemberIds.forEach((gid) => (allIn ? next.delete(gid) : next.add(gid)));
    const firstSelected = elements.find((e) => next.has(e.id));
    if (firstSelected) {
      set({
        selectedIds: next,
        currentStrokeColor: firstSelected.strokeColor ?? get().currentStrokeColor,
        currentFillColor: firstSelected.fillColor ?? get().currentFillColor,
        currentStrokeWidth: firstSelected.strokeWidth ?? get().currentStrokeWidth,
        currentStrokeStyle: firstSelected.strokeStyle ?? get().currentStrokeStyle,
        currentFillStyle: firstSelected.fillStyle ?? get().currentFillStyle,
        currentRoughness: firstSelected.roughness ?? get().currentRoughness,
        currentOpacity: firstSelected.opacity ?? get().currentOpacity,
        currentFontFamily: (firstSelected as any).fontFamily ?? get().currentFontFamily,
      });
    } else {
      set({ selectedIds: next });
    }
  },

  selectGroupMembers: (hitId, shiftKey) => {
    const { elements, selectedIds } = get();
    const hit = elements.find((e) => e.id === hitId);
    if (!hit) return;

    // Get all elements in any connected group with hitId
    const groupMembers = getConnectedGroupElementIds(elements, [hitId]);

    if (shiftKey) {
      const allIn = Array.from(groupMembers).every((id) => selectedIds.has(id));
      const next = new Set(selectedIds);
      groupMembers.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
      const firstSelected = elements.find((e) => next.has(e.id));
      if (firstSelected) {
        set({
          selectedIds: next,
          currentStrokeColor: firstSelected.strokeColor ?? get().currentStrokeColor,
          currentFillColor: firstSelected.fillColor ?? get().currentFillColor,
          currentStrokeWidth: firstSelected.strokeWidth ?? get().currentStrokeWidth,
          currentStrokeStyle: firstSelected.strokeStyle ?? get().currentStrokeStyle,
          currentFillStyle: firstSelected.fillStyle ?? get().currentFillStyle,
          currentRoughness: firstSelected.roughness ?? get().currentRoughness,
          currentOpacity: firstSelected.opacity ?? get().currentOpacity,
          currentFontFamily: (firstSelected as any).fontFamily ?? get().currentFontFamily,
        });
      } else {
        set({ selectedIds: next });
      }
    } else {
      set({
        selectedIds: groupMembers,
        currentStrokeColor: hit.strokeColor ?? get().currentStrokeColor,
        currentFillColor: hit.fillColor ?? get().currentFillColor,
        currentStrokeWidth: hit.strokeWidth ?? get().currentStrokeWidth,
        currentStrokeStyle: hit.strokeStyle ?? get().currentStrokeStyle,
        currentFillStyle: hit.fillStyle ?? get().currentFillStyle,
        currentRoughness: hit.roughness ?? get().currentRoughness,
        currentOpacity: hit.opacity ?? get().currentOpacity,
        currentFontFamily: (hit as any).fontFamily ?? get().currentFontFamily,
      });
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
    const prevBg = get().background;
    const newBg: BackgroundConfig = typeof bg === 'string'
      ? { type: 'color', color: bg }
      : { ...prevBg, ...bg, type: bg.type || prevBg.type || 'color' };

    const prevColor = prevBg.color || '#14141a';
    const newColor = newBg.color || '#14141a';
    const prevIsLight = isColorLight(prevColor);
    const newIsLight = isColorLight(newColor);

    let nextStroke = get().currentStrokeColor;
    let nextElements = get().elements;

    // When background switches between light and dark, adapt default monochrome colors
    if (prevIsLight !== newIsLight) {
      if (newIsLight) {
        // Switched to light background: default stroke becomes black (#1e1e1e)
        if (nextStroke === '#ffffff') nextStroke = '#1e1e1e';
        nextElements = nextElements.map((el) =>
          el.strokeColor === '#ffffff' ? { ...el, strokeColor: '#1e1e1e' } : el
        );
      } else {
        // Switched to dark background: default stroke becomes white (#ffffff)
        if (nextStroke === '#1e1e1e' || nextStroke === '#000000') nextStroke = '#ffffff';
        nextElements = nextElements.map((el) =>
          el.strokeColor === '#1e1e1e' || el.strokeColor === '#000000' ? { ...el, strokeColor: '#ffffff' } : el
        );
      }
    }

    set({ background: newBg, currentStrokeColor: nextStroke, elements: nextElements });
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

  updateElement: (id, updates, shouldSave = true) => {
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } as CanvasElement : el)),
    }));
    if (shouldSave) {
      get().saveToStorage();
    }
  },

  updateSelectedElements: (updates) => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
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

  copySelected: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    const selected = elements.filter((el) => selectedIds.has(el.id) && !el.locked);
    if (selected.length === 0) return;

    pasteOffsetMultiplier = 1;
    const cloned = JSON.parse(JSON.stringify(selected)) as CanvasElement[];
    set({ clipboard: cloned });

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(
            JSON.stringify({
              type: 'canvas-elements',
              version: 1,
              elements: cloned,
            })
          )
          .catch(() => {});
      }
    } catch {
      // Ignore clipboard restrictions
    }
  },

  cutSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().copySelected();
    get().deleteSelected();
  },

  pasteClipboard: (elementsToPaste?: CanvasElement[]) => {
    const { elements } = get();
    const source =
      elementsToPaste && elementsToPaste.length > 0 ? elementsToPaste : get().clipboard;
    if (!source || source.length === 0) return;

    get().pushHistory();

    const offset = 20 * pasteOffsetMultiplier;
    pasteOffsetMultiplier = (pasteOffsetMultiplier % 15) + 1;

    const groupIdMap = new Map<string, string>();
    const newElements: CanvasElement[] = [];
    const newIds: string[] = [];

    source.forEach((el) => {
      const clone = JSON.parse(JSON.stringify(el)) as CanvasElement;
      clone.id = newId();
      clone.locked = false;
      clone.seed = randomSeed();

      if (clone.groupIds && clone.groupIds.length) {
        clone.groupIds = clone.groupIds.map((gid) => {
          if (!groupIdMap.has(gid)) groupIdMap.set(gid, newId());
          return groupIdMap.get(gid)!;
        });
      }

      if ('points' in clone && Array.isArray(clone.points)) {
        clone.points = clone.points.map((p) => ({
          x: p.x + offset,
          y: p.y + offset,
        })) as [Point, Point] & Point[];
      } else if (
        'x' in clone &&
        'y' in clone &&
        typeof clone.x === 'number' &&
        typeof clone.y === 'number'
      ) {
        clone.x += offset;
        clone.y += offset;
      }

      newElements.push(clone);
      newIds.push(clone.id);
    });

    set((state) => ({
      elements: [...state.elements, ...newElements],
      selectedIds: new Set(newIds),
      currentTool: 'selection',
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
    const { selectedIds, elements } = get();
    if (selectedIds.size < 2) return;
    get().pushHistory();
    const { elements: nextElements } = groupElements(elements, selectedIds);
    set({ elements: nextElements });
    get().saveToStorage();
  },

  ungroupSelected: () => {
    const { selectedIds, elements } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    const nextElements = ungroupElements(elements, selectedIds);
    set({ elements: nextElements });
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

  resetHistory: () => {
    set({ history: [], future: [], selectedIds: new Set(), draft: null });
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

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['wallpaperElements', 'wallpaperBackground'], (result: Record<string, any>) => {
          if (result.wallpaperElements) {
            try {
              set({ elements: sanitize(JSON.parse(result.wallpaperElements as string)) });
            } catch (e) {}
          }
          if (result.wallpaperBackground) {
            try {
              const bg = JSON.parse(result.wallpaperBackground as string);
              const bgObj = typeof bg === 'string' ? { type: 'color' as const, color: bg } : bg;
              const isLight = isColorLight(bgObj.color || '#14141a');
              const curStroke = get().currentStrokeColor;
              let nextStroke = curStroke;
              if (isLight && curStroke === '#ffffff') nextStroke = '#1e1e1e';
              else if (!isLight && (curStroke === '#1e1e1e' || curStroke === '#000000')) nextStroke = '#ffffff';
              set({ background: bgObj, currentStrokeColor: nextStroke });
            } catch (e) {
              const bgObj = { type: 'color' as const, color: String(result.wallpaperBackground) };
              set({ background: bgObj, currentStrokeColor: isColorLight(bgObj.color) ? '#1e1e1e' : '#ffffff' });
            }
          }
        });
      } else {
        const rawEl = localStorage.getItem('wallpaperElements');
        if (rawEl) {
          try {
            set({ elements: sanitize(JSON.parse(rawEl)) });
          } catch (e) {}
        }
        const rawBg = localStorage.getItem('wallpaperBackground');
        if (rawBg) {
          try {
            const bg = JSON.parse(rawBg);
            const bgObj = typeof bg === 'string' ? { type: 'color' as const, color: bg } : bg;
            const isLight = isColorLight(bgObj.color || '#14141a');
            const curStroke = get().currentStrokeColor;
            let nextStroke = curStroke;
            if (isLight && curStroke === '#ffffff') nextStroke = '#1e1e1e';
            else if (!isLight && (curStroke === '#1e1e1e' || curStroke === '#000000')) nextStroke = '#ffffff';
            set({ background: bgObj, currentStrokeColor: nextStroke });
          } catch (e) {
            const bgObj = { type: 'color' as const, color: rawBg };
            set({ background: bgObj, currentStrokeColor: isColorLight(bgObj.color) ? '#1e1e1e' : '#ffffff' });
          }
        }
      }
    } catch (e) {
      console.error('Storage load error', e);
    }
  },
}));
