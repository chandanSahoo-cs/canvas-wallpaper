import { CanvasElement, BackgroundConfig } from '../elements/types';
import { isColorLight } from '../lib/utils';

export function sanitizeCanvasElements(raw: any): CanvasElement[] {
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
}

export function saveAppStoreToStorage(
  elements: CanvasElement[],
  background: BackgroundConfig
): void {
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
}

export function loadAppStoreFromStorage(
  currentStrokeColor: string,
  onLoaded: (data: {
    elements?: CanvasElement[];
    background?: BackgroundConfig;
    nextStroke?: string;
  }) => void
): void {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['wallpaperElements', 'wallpaperBackground'], (result: Record<string, any>) => {
        const update: {
          elements?: CanvasElement[];
          background?: BackgroundConfig;
          nextStroke?: string;
        } = {};

        if (result.wallpaperElements) {
          try {
            update.elements = sanitizeCanvasElements(JSON.parse(result.wallpaperElements as string));
          } catch (e) {}
        }

        if (result.wallpaperBackground) {
          try {
            const bg = JSON.parse(result.wallpaperBackground as string);
            const bgObj: BackgroundConfig = typeof bg === 'string' ? { type: 'color' as const, color: bg } : bg;
            const isLight = isColorLight(bgObj.color || '#14141a');
            let nextStroke = currentStrokeColor;
            if (isLight && currentStrokeColor === '#ffffff') nextStroke = '#1e1e1e';
            else if (!isLight && (currentStrokeColor === '#1e1e1e' || currentStrokeColor === '#000000')) nextStroke = '#ffffff';
            update.background = bgObj;
            update.nextStroke = nextStroke;
          } catch (e) {
            const bgObj: BackgroundConfig = { type: 'color' as const, color: String(result.wallpaperBackground) };
            update.background = bgObj;
            update.nextStroke = isColorLight(bgObj.color || '#14141a') ? '#1e1e1e' : '#ffffff';
          }
        }

        onLoaded(update);
      });
    } else {
      const update: {
        elements?: CanvasElement[];
        background?: BackgroundConfig;
        nextStroke?: string;
      } = {};

      const rawEl = localStorage.getItem('wallpaperElements');
      if (rawEl) {
        try {
          update.elements = sanitizeCanvasElements(JSON.parse(rawEl));
        } catch (e) {}
      }

      const rawBg = localStorage.getItem('wallpaperBackground');
      if (rawBg) {
        try {
          const bg = JSON.parse(rawBg);
          const bgObj: BackgroundConfig = typeof bg === 'string' ? { type: 'color' as const, color: bg } : bg;
          const isLight = isColorLight(bgObj.color || '#14141a');
          let nextStroke = currentStrokeColor;
          if (isLight && currentStrokeColor === '#ffffff') nextStroke = '#1e1e1e';
          else if (!isLight && (currentStrokeColor === '#1e1e1e' || currentStrokeColor === '#000000')) nextStroke = '#ffffff';
          update.background = bgObj;
          update.nextStroke = nextStroke;
        } catch (e) {
          const bgObj: BackgroundConfig = { type: 'color' as const, color: rawBg };
          update.background = bgObj;
          update.nextStroke = isColorLight(bgObj.color || '#14141a') ? '#1e1e1e' : '#ffffff';
        }
      }

      onLoaded(update);
    }
  } catch (e) {
    console.error('Storage load error', e);
  }
}
