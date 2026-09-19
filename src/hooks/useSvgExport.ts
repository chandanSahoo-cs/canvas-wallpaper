import { useAppStore } from '../store/useAppStore';
import { CanvasElement, TextElement, ImageElement } from '../elements/types';
import { getCenter, normBox, diamondPoints, FONT_SIZE_MAP } from '../canvas/geometry';

export function exportWallpaperAsSvg(): void {
  const { elements, background } = useAppStore.getState();
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svgParts: string[] = [];
  svgParts.push(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`
  );

  // Background
  const bgColor = background.type === 'color' ? background.color : '#14141a';
  svgParts.push(`<rect width="100%" height="100%" fill="${bgColor}" />`);

  for (const el of elements) {
    const opacity = (el.opacity ?? 100) / 100;
    const center = getCenter(el);
    const rotateAttr = el.angle
      ? ` transform="rotate(${(el.angle * 180) / Math.PI} ${center.x} ${center.y})"`
      : '';
    const dashAttr =
      el.strokeStyle === 'dashed'
        ? ` stroke-dasharray="${el.strokeWidth * 4},${el.strokeWidth * 3}"`
        : el.strokeStyle === 'dotted'
        ? ` stroke-dasharray="${el.strokeWidth},${el.strokeWidth * 2.5}"`
        : '';

    const commonAttr = `stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" fill="${
      el.fillColor === 'transparent' ? 'none' : el.fillColor
    }" opacity="${opacity}"${dashAttr}${rotateAttr}`;

    switch (el.type) {
      case 'rectangle': {
        const nb = normBox(el);
        svgParts.push(
          `<rect x="${nb.x}" y="${nb.y}" width="${nb.w}" height="${nb.h}" ${commonAttr} />`
        );
        break;
      }
      case 'diamond': {
        const nb = normBox(el);
        const pts = diamondPoints(nb.x, nb.y, nb.w, nb.h)
          .map(([x, y]) => `${x},${y}`)
          .join(' ');
        svgParts.push(`<polygon points="${pts}" ${commonAttr} />`);
        break;
      }
      case 'ellipse': {
        const nb = normBox(el);
        const cx = nb.x + nb.w / 2;
        const cy = nb.y + nb.h / 2;
        svgParts.push(
          `<ellipse cx="${cx}" cy="${cy}" rx="${nb.w / 2}" ry="${nb.h / 2}" ${commonAttr} />`
        );
        break;
      }
      case 'line': {
        const [p0, p1] = el.points;
        svgParts.push(
          `<line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" ${commonAttr} />`
        );
        break;
      }
      case 'arrow': {
        const [p0, p1] = el.points;
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const headLen = 10 + el.strokeWidth * 3;
        const a1 = angle + Math.PI - 0.5;
        const a2 = angle + Math.PI + 0.5;
        const h1x = p1.x + headLen * Math.cos(a1);
        const h1y = p1.y + headLen * Math.sin(a1);
        const h2x = p1.x + headLen * Math.cos(a2);
        const h2y = p1.y + headLen * Math.sin(a2);

        svgParts.push(
          `<line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" ${commonAttr} />`
        );
        svgParts.push(
          `<line x1="${p1.x}" y1="${p1.y}" x2="${h1x}" y2="${h1y}" ${commonAttr} />`
        );
        svgParts.push(
          `<line x1="${p1.x}" y1="${p1.y}" x2="${h2x}" y2="${h2y}" ${commonAttr} />`
        );
        break;
      }
      case 'freedraw': {
        const pts = el.points;
        if (pts.length > 0) {
          let d = `M ${pts[0].x} ${pts[0].y}`;
          for (let i = 1; i < pts.length; i++) {
            d += ` L ${pts[i].x} ${pts[i].y}`;
          }
          svgParts.push(
            `<path d="${d}" fill="none" stroke="${el.strokeColor}" stroke-width="${
              el.strokeWidth * 2
            }" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"${rotateAttr} />`
          );
        }
        break;
      }
      case 'text': {
        const textEl = el as TextElement;
        const fontSize = FONT_SIZE_MAP[textEl.strokeWidth] || 20;
        const lines = textEl.text.split('\n');
        const lineHeight = fontSize * 1.3;

        let textSpans = '';
        for (let i = 0; i < lines.length; i++) {
          textSpans += `<tspan x="${textEl.x}" dy="${i === 0 ? 0 : lineHeight}">${lines[
            i
          ].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`;
        }

        svgParts.push(
          `<text x="${textEl.x}" y="${
            textEl.y + fontSize
          }" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="${fontSize}" fill="${
            textEl.strokeColor
          }" opacity="${opacity}"${rotateAttr}>${textSpans}</text>`
        );
        break;
      }
      case 'image': {
        const imgEl = el as ImageElement;
        svgParts.push(
          `<image href="${imgEl.dataUrl}" x="${imgEl.x}" y="${imgEl.y}" width="${imgEl.width}" height="${imgEl.height}" opacity="${opacity}"${rotateAttr} />`
        );
        break;
      }
    }
  }

  svgParts.push('</svg>');

  const svgBlob = new Blob([svgParts.join('\n')], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallpaper-${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
