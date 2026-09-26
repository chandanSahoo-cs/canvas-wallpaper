import { ImageElement } from '../elements/types';
import { newId, randomSeed } from './utils';
import { useAppStore } from '../store/useAppStore';

export function optimizeImageDataUrl(img: HTMLImageElement, maxDimension = 1600): string {
  if (img.width <= maxDimension && img.height <= maxDimension) {
    return img.src;
  }
  const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/png');
}

export function insertImageFromFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const store = useAppStore.getState();
        const maxW = Math.min(500, window.innerWidth * 0.7);
        const maxH = Math.min(400, window.innerHeight * 0.7);
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        // Center within current zoomed/panned canvas viewport
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        const cx = Math.round(screenCenterX / store.zoom + store.scrollOffset.x - w / 2);
        const cy = Math.round(screenCenterY / store.zoom + store.scrollOffset.y - h / 2);

        const finalDataUrl = optimizeImageDataUrl(img);

        const imageEl: ImageElement = {
          id: newId(),
          type: 'image',
          angle: 0,
          locked: false,
          groupIds: [],
          x: cx,
          y: cy,
          width: w,
          height: h,
          dataUrl: finalDataUrl,
          strokeColor: '#1e1e1e',
          fillColor: 'transparent',
          strokeWidth: 1.5,
          opacity: 100,
          seed: randomSeed(),
        };

        store.pushHistory();
        store.setElements([...store.elements, imageEl]);
        store.setSelectedIds(new Set([imageEl.id]));
        store.setTool('selection');
        store.saveToStorage();
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(file);
  });
}
