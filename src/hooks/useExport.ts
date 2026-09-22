import rough from 'roughjs';
import { useAppStore } from '../store/useAppStore';
import { CanvasElement, Point, TextElement, ImageElement } from '../elements/types';
import { getRoughDrawable, roughOptions } from '../canvas/rough-cache';
import { getCenter, FONT_SIZE_MAP, getFontFamilyString } from '../canvas/geometry';

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
  if (background.type === 'image' && background.imageUrl) {
    const bgImg = new Image();
    bgImg.src = background.imageUrl;
    await new Promise((resolve) => {
      if (bgImg.complete) resolve(true);
      else bgImg.onload = () => resolve(true);
    });
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    ctx.fillStyle = background.color || '#14141a';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw pattern overlay if selected
  if (background.pattern && background.pattern !== 'none') {
    ctx.save();
    const isLight = background.color === '#f5f5f7';
    const patColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
    ctx.strokeStyle = patColor;
    ctx.fillStyle = patColor;

    if (background.pattern === 'dots') {
      const step = 24;
      for (let x = 12; x < width; x += step) {
        for (let y = 12; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (background.pattern === 'grid') {
      const step = 24;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (background.pattern === 'lines') {
      const step = 28;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
    ctx.restore();
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
        const pts = el.points;
        if (pts.length === 2) {
          rc.line(pts[0].x, pts[0].y, pts[1].x, pts[1].y, roughOptions(el));
        } else if (pts.length > 2) {
          rc.linearPath(pts.map((p) => [p.x, p.y]), roughOptions(el));
        }
        break;
      }
      case 'arrow': {
        const pts = el.points;
        if (pts.length < 2) break;
        const opts = roughOptions(el);
        if (pts.length === 2) {
          rc.line(pts[0].x, pts[0].y, pts[1].x, pts[1].y, opts);
        } else {
          rc.linearPath(pts.map((p) => [p.x, p.y]), opts);
        }
        const pLast = pts[pts.length - 1];
        const pPrev = pts[pts.length - 2];
        const angle = Math.atan2(pLast.y - pPrev.y, pLast.x - pPrev.x);
        const headLen = 10 + el.strokeWidth * 3;
        const a1 = angle + Math.PI - 0.5;
        const a2 = angle + Math.PI + 0.5;
        rc.line(pLast.x, pLast.y, pLast.x + headLen * Math.cos(a1), pLast.y + headLen * Math.sin(a1), opts);
        rc.line(pLast.x, pLast.y, pLast.x + headLen * Math.cos(a2), pLast.y + headLen * Math.sin(a2), opts);
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
        const textStr = typeof textEl.text === 'string' ? textEl.text : '';
        if (!textStr) break;
        const fontSize = textEl.fontSize || FONT_SIZE_MAP[textEl.strokeWidth] || 20;
        ctx.font = `${fontSize}px ${getFontFamilyString(textEl.fontFamily)}`;
        ctx.fillStyle = textEl.strokeColor || '#1e1e1e';
        ctx.textBaseline = 'top';
        const lines = textStr.split('\n');
        const lineHeight = fontSize * 1.25;
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], textEl.x ?? 0, (textEl.y ?? 0) + i * lineHeight);
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
