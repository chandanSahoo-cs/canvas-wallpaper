import rough from 'roughjs';
import { useAppStore } from '../store/useAppStore';
import { CanvasElement, Point, TextElement, ImageElement } from '../elements/types';
import { getRoughDrawable, roughOptions } from '../canvas/rough-cache';
import { getCenter, FONT_SIZE_MAP } from '../canvas/geometry';

export async function exportWallpaperAsPng(): Promise<void> {
  const state = useAppStore.getState();
  const { elements, background } = state;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  const offscreen = document.createElement('canvas');
  offscreen.width = width * dpr;
  offscreen.height = height * dpr;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 1. Draw background
  if (background.type === 'color') {
    ctx.fillStyle = background.color || '#14141a';
    ctx.fillRect(0, 0, width, height);
  } else if (background.type === 'image' && background.imageUrl) {
    const bgImg = new Image();
    bgImg.src = background.imageUrl;
    await new Promise((resolve) => {
      if (bgImg.complete) resolve(true);
      else bgImg.onload = () => resolve(true);
    });
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#14141a';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw elements
  const rc = rough.canvas(offscreen);

  for (const el of elements) {
    ctx.save();
    ctx.globalAlpha = (el.opacity ?? 100) / 100;

    if (el.angle) {
      const c = getCenter(el);
      ctx.translate(c.x, c.y);
      ctx.rotate(el.angle);
      ctx.translate(-c.x, -c.y);
    }

    switch (el.type) {
      case 'rectangle':
      case 'diamond':
      case 'ellipse': {
        const drawable = getRoughDrawable(el);
        if (drawable) rc.draw(drawable);
        break;
      }
      case 'line': {
        rc.line(el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, roughOptions(el));
        break;
      }
      case 'arrow': {
        const [p0, p1] = el.points;
        const opts = roughOptions(el);
        rc.line(p0.x, p0.y, p1.x, p1.y, opts);
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const headLen = 10 + el.strokeWidth * 3;
        const a1 = angle + Math.PI - 0.5;
        const a2 = angle + Math.PI + 0.5;
        rc.line(p1.x, p1.y, p1.x + headLen * Math.cos(a1), p1.y + headLen * Math.sin(a1), opts);
        rc.line(p1.x, p1.y, p1.x + headLen * Math.cos(a2), p1.y + headLen * Math.sin(a2), opts);
        break;
      }
      case 'freedraw': {
        const pts = el.points;
        if (pts.length > 0) {
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
        break;
      }
      case 'text': {
        const textEl = el as TextElement;
        const fontSize = FONT_SIZE_MAP[textEl.strokeWidth] || 20;
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = textEl.strokeColor;
        ctx.textBaseline = 'top';
        const lines = textEl.text.split('\n');
        const lineHeight = fontSize * 1.3;
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], textEl.x, textEl.y + i * lineHeight);
        }
        break;
      }
      case 'image': {
        const imgEl = el as ImageElement;
        const img = new Image();
        img.src = imgEl.dataUrl;
        if (img.complete) {
          ctx.drawImage(img, imgEl.x, imgEl.y, imgEl.width, imgEl.height);
        } else {
          await new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          ctx.drawImage(img, imgEl.x, imgEl.y, imgEl.width, imgEl.height);
        }
        break;
      }
    }

    ctx.restore();
  }

  // 3. Export to PNG and download
  const dataUrl = offscreen.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `wallpaper-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
