import rough from 'roughjs';
import { CanvasElement, Point, TextElement, ImageElement } from '../../elements/types';
import { roughOptions } from '../rough-cache';
import { FONT_SIZE_MAP, getFontFamilyString } from '../geometry';
import { useAppStore } from '../../store/useAppStore';

type RoughCanvas = ReturnType<typeof rough.canvas>;

export const imageElementCache = new Map<string, HTMLImageElement>();

export function drawArrow(
  rc: RoughCanvas,
  el: CanvasElement & { points: Point[] }
): void {
  const pts = el.points;
  if (pts.length < 2) return;
  const opts = roughOptions(el);
  if (pts.length === 2) {
    rc.line(pts[0].x, pts[0].y, pts[1].x, pts[1].y, opts);
  } else {
    rc.linearPath(pts.map((p) => [p.x, p.y]), opts);
  }
  const pLast = pts[pts.length - 1];
  const pPrev = pts[pts.length - 2];
  const angle = Math.atan2(pLast.y - pPrev.y, pLast.x - pPrev.x);
  const lineLen = Math.hypot(pLast.x - pPrev.x, pLast.y - pPrev.y);
  const headLen = Math.min(10 + el.strokeWidth * 3, Math.max(lineLen * 0.75, 4));
  const a1 = angle + Math.PI - 0.5;
  const a2 = angle + Math.PI + 0.5;
  rc.line(pLast.x, pLast.y, pLast.x + headLen * Math.cos(a1), pLast.y + headLen * Math.sin(a1), opts);
  rc.line(pLast.x, pLast.y, pLast.x + headLen * Math.cos(a2), pLast.y + headLen * Math.sin(a2), opts);
}

export function drawFreedraw(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement & { points: Point[] }
): void {
  const pts = el.points;
  if (pts.length < 1) return;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = el.strokeWidth * 2.2;
  ctx.strokeStyle = el.strokeColor;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 1) {
    ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  el: TextElement
): void {
  const textStr = typeof el.text === 'string' ? el.text : '';
  if (!textStr) return;
  const fontSize = el.fontSize || FONT_SIZE_MAP[el.strokeWidth] || 20;
  ctx.font = `${fontSize}px ${getFontFamilyString(el.fontFamily)}`;
  ctx.fillStyle = el.strokeColor || useAppStore.getState().currentStrokeColor || '#ffffff';
  ctx.textBaseline = 'top';

  const lines = textStr.split('\n');
  const lineHeight = fontSize * 1.25;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], el.x ?? 0, (el.y ?? 0) + i * lineHeight);
  }
}

export function drawImage(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
  onNeedRender?: () => void
): void {
  let img = imageElementCache.get(el.dataUrl);
  if (!img) {
    if (imageElementCache.size >= 50) {
      const oldestKey = imageElementCache.keys().next().value;
      if (oldestKey) imageElementCache.delete(oldestKey);
    }
    img = new Image();
    img.src = el.dataUrl;
    img.onload = () => {
      onNeedRender?.();
    };
    imageElementCache.set(el.dataUrl, img);
  }
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, el.x, el.y, el.width, el.height);
  }
}
