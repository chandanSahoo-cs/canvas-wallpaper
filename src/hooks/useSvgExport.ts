import { useAppStore } from '../store/useAppStore';
import { CanvasElement, TextElement, ImageElement } from '../elements/types';
import { getCenter, normBox, diamondPoints, FONT_SIZE_MAP, getFontFamilyString } from '../canvas/geometry';
import { escapeXml } from '../lib/utils';

export function exportWallpaperAsSvg(): void {
  const { elements, background } = useAppStore.getState();
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svgParts: string[] = [];
  svgParts.push(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`
  );

  // Background
  const bgColor = escapeXml(background.type === 'color' ? background.color : '#14141a');
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

    const strokeColor = escapeXml(el.strokeColor || '#ffffff');
    const fillColor = el.fillColor === 'transparent' ? 'none' : escapeXml(el.fillColor);
    const commonAttr = `stroke="${strokeColor}" stroke-width="${el.strokeWidth}" fill="${fillColor}" opacity="${opacity}"${dashAttr}${rotateAttr}`;

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
        const pts = el.points;
        if (pts.length === 2) {
          svgParts.push(
            `<line x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[1].x}" y2="${pts[1].y}" ${commonAttr} />`
          );
        } else if (pts.length > 2) {
          const ptStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
          svgParts.push(
            `<polyline points="${ptStr}" fill="none" ${commonAttr} />`
          );
        }
        break;
      }
      case 'arrow': {
        const pts = el.points;
        if (pts.length < 2) break;
        if (pts.length === 2) {
          svgParts.push(
            `<line x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[1].x}" y2="${pts[1].y}" ${commonAttr} />`
          );
        } else {
          const ptStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
          svgParts.push(
            `<polyline points="${ptStr}" fill="none" ${commonAttr} />`
          );
        }

        const p1 = pts[pts.length - 1];
        const p0 = pts[pts.length - 2];
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const headLen = 10 + el.strokeWidth * 3;
        const a1 = angle + Math.PI - 0.5;
        const a2 = angle + Math.PI + 0.5;
        const h1x = p1.x + headLen * Math.cos(a1);
        const h1y = p1.y + headLen * Math.sin(a1);
        const h2x = p1.x + headLen * Math.cos(a2);
        const h2y = p1.y + headLen * Math.sin(a2);

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
            `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${
              el.strokeWidth * 2
            }" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"${rotateAttr} />`
          );
        }
        break;
      }
      case 'text': {
        const textEl = el as TextElement;
        const textStr = typeof textEl.text === 'string' ? textEl.text : '';
        if (!textStr) break;
        const fontSize = textEl.fontSize || FONT_SIZE_MAP[textEl.strokeWidth] || 20;
        const lines = textStr.split('\n');
        const lineHeight = fontSize * 1.3;

        let textSpans = '';
        for (let i = 0; i < lines.length; i++) {
          textSpans += `<tspan x="${textEl.x ?? 0}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(lines[i])}</tspan>`;
        }

        const fontFamily = escapeXml(getFontFamilyString(textEl.fontFamily).replace(/"/g, "'"));
        const textColor = escapeXml(textEl.strokeColor || '#1e1e1e');
        svgParts.push(
          `<text x="${textEl.x ?? 0}" y="${
            (textEl.y ?? 0) + fontSize
          }" font-family="${fontFamily}" font-size="${fontSize}" fill="${textColor}" opacity="${opacity}"${rotateAttr}>${textSpans}</text>`
        );
        break;
      }
      case 'image': {
        const imgEl = el as ImageElement;
        const safeDataUrl = escapeXml(imgEl.dataUrl);
        svgParts.push(
          `<image href="${safeDataUrl}" x="${imgEl.x}" y="${imgEl.y}" width="${imgEl.width}" height="${imgEl.height}" opacity="${opacity}"${rotateAttr} />`
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
