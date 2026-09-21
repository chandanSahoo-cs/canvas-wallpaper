import { useAppStore } from '../store/useAppStore';
import { useSceneStore } from '../store/useSceneStore';
import { CanvasElement, BackgroundConfig } from '../elements/types';

export interface WallpaperFileData {
  app: 'canvas-wallpaper';
  version: number;
  name?: string;
  background: BackgroundConfig;
  elements: CanvasElement[];
  exportedAt: number;
}

export function exportWallpaperFile(sceneName?: string) {
  const { background, elements } = useAppStore.getState();
  const data: WallpaperFileData = {
    app: 'canvas-wallpaper',
    version: 2,
    name: sceneName || 'My Wallpaper',
    background,
    elements,
    exportedAt: Date.now(),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = (sceneName || 'wallpaper').toLowerCase().replace(/[^a-z0-9]/g, '-');
  a.download = `${fileName}.canvaswallpaper`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importWallpaperFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const data = JSON.parse(raw);
        if (data.elements && Array.isArray(data.elements)) {
          const appStore = useAppStore.getState();
          const sceneStore = useSceneStore.getState();
          appStore.pushHistory();

          if (data.name) {
            sceneStore.renameScene(sceneStore.activeSceneId, data.name);
          }
          if (data.background) {
            appStore.setBackground(data.background);
          }
          appStore.setElements(data.elements);
          appStore.saveToStorage();
          resolve(true);
          return;
        }
      } catch (err) {
        console.error('Import error:', err);
      }
      resolve(false);
    };
    reader.readAsText(file);
  });
}
