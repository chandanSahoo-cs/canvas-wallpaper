import { Point, CanvasElement, RectangleElement, DiamondElement, EllipseElement, LineElement, ArrowElement, FreedrawElement, TextElement, ImageElement, FontFamily } from '../elements/types';

export const FONT_SIZE_MAP: Record<number, number> = { 1.5: 16, 3: 20, 5.5: 28, 8: 36 };
export const EXCALIDRAW_FONT_FAMILY =
  'Excalifont, Virgil, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function getFontFamilyString(family?: FontFamily): string {
  if (family === 'sans') {
    return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  if (family === 'monospace') {
    return '"Cascadia Code", "Courier New", monospace';
  }
  return EXCALIDRAW_FONT_FAMILY;
}

export const HANDLE_HIT_RADIUS = 16;
export const ROTATE_HANDLE_OFFSET = 28;

let sharedMeasureCtx: CanvasRenderingContext2D | null = null;
function getSharedMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!sharedMeasureCtx) {
    const c = document.createElement('canvas');
    sharedMeasureCtx = c.getContext('2d');
  }
  return sharedMeasureCtx;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SelectionFrame {
  bbox: BoundingBox;
  angle: number;
  center: Point;
  isLine?: boolean;
  lineElement?: LineElement | ArrowElement;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

export function normBox(el: { x: number; y: number; width: number; height: number }): BoundingBox {
  return {
    x: Math.min(el.x, el.x + el.width),
    y: Math.min(el.y, el.y + el.height),
    w: Math.abs(el.width),
    h: Math.abs(el.height),
  };
}

export function diamondPoints(x: number, y: number, w: number, h: number): [number, number][] {
  return [
    [x + w / 2, y],
    [x + w, y + h / 2],
    [x + w / 2, y + h],
    [x, y + h / 2],
  ];
}

export function rotatePoint(pos: Point, center: Point, angle: number): Point {
  if (!angle) return pos;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const dx = pos.x - center.x, dy = pos.y - center.y;
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

export function getBBox(el: CanvasElement): BoundingBox {
  if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse' || el.type === 'image') {
    return normBox(el);
  }
  if (el.type === 'line' || el.type === 'arrow') {
    const xs = el.points.map((p) => p.x);
    const ys = el.points.map((p) => p.y);
    if (xs.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return {
      x: minX,
      y: minY,
      w: Math.max(maxX - minX, 4),
      h: Math.max(maxY - minY, 4),
    };
  }
  if (el.type === 'freedraw') {
    const xs = el.points.map((p) => p.x),
      ys = el.points.map((p) => p.y);
    if (xs.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  if (el.type === 'text') {
    const textEl = el as TextElement;
    const fontSize = textEl.fontSize || FONT_SIZE_MAP[textEl.strokeWidth] || 20;
    const textStr = typeof textEl.text === 'string' ? textEl.text : '';
    const lines = textStr ? textStr.split('\n') : [''];
    const lineHeight = fontSize * 1.25;

    const ctx = getSharedMeasureCtx();
    let maxLineWidth = 0;
    if (ctx) {
      ctx.font = `${fontSize}px ${getFontFamilyString(textEl.fontFamily)}`;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxLineWidth) maxLineWidth = w;
      }
    } else {
      const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
      maxLineWidth = maxLineLen * (fontSize * 0.6);
    }

    const approxWidth = Math.max(maxLineWidth + 4, 24);
    return {
      x: textEl.x ?? 0,
      y: textEl.y ?? 0,
      w: approxWidth,
      h: Math.max(lines.length * lineHeight, lineHeight),
    };
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function getCenter(el: CanvasElement): Point {
  const b = getBBox(el);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

export function getScreenBBox(el: CanvasElement): BoundingBox {
  const b = getBBox(el);
  if (!el.angle) return b;
  const center = getCenter(el);
  const corners = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
  ].map((p) => rotatePoint(p, center, el.angle || 0));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

export function rectsIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function elementContains(el: CanvasElement, localPos: Point): boolean {
  if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse' || el.type === 'text' || el.type === 'image') {
    const b = getBBox(el);
    return localPos.x >= b.x - 4 && localPos.x <= b.x + b.w + 4 && localPos.y >= b.y - 4 && localPos.y <= b.y + b.h + 4;
  }
  if (el.type === 'line' || el.type === 'arrow') {
    for (let i = 0; i < el.points.length - 1; i++) {
      if (distanceToSegment(localPos, el.points[i], el.points[i + 1]) <= 6 + el.strokeWidth) return true;
    }
    return false;
  }
  if (el.type === 'freedraw') {
    for (let i = 0; i < el.points.length - 1; i++) {
      if (distanceToSegment(localPos, el.points[i], el.points[i + 1]) <= 6 + el.strokeWidth) return true;
    }
    return el.points.length === 1 && distance(localPos, el.points[0]) <= 6 + el.strokeWidth;
  }
  return false;
}

export function computeSelectionFrame(members: CanvasElement[]): SelectionFrame | null {
  if (members.length === 0) return null;
  if (members.length === 1) {
    const el = members[0];
    const isLine = el.type === 'line' || el.type === 'arrow';
    return {
      bbox: getBBox(el),
      angle: el.angle || 0,
      center: getCenter(el),
      isLine,
      lineElement: isLine ? (el as LineElement | ArrowElement) : undefined,
    };
  }
  const boxes = members.map(getScreenBBox);
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  const bbox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  return { bbox, angle: 0, center: { x: x0 + bbox.w / 2, y: y0 + bbox.h / 2 } };
}

export function getHandlePositions(frame: SelectionFrame): Record<string, Point> {
  if (frame.isLine && frame.lineElement && frame.lineElement.points.length >= 2) {
    const pts = frame.lineElement.points;
    const p0 = pts[0];
    const pEnd = pts[pts.length - 1];
    let pMid: Point;
    if (pts.length === 3) {
      pMid = pts[1];
    } else {
      pMid = { x: (p0.x + pEnd.x) / 2, y: (p0.y + pEnd.y) / 2 };
    }
    return {
      'line-start': p0,
      'line-mid': pMid,
      'line-end': pEnd,
    };
  }

  const b = frame.bbox;
  const PAD = 8;
  const x0 = b.x - PAD, y0 = b.y - PAD, x1 = b.x + b.w + PAD, y1 = b.y + b.h + PAD;
  const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2;
  const local: Record<string, Point> = {
    nw: { x: x0, y: y0 },
    n: { x: midX, y: y0 },
    ne: { x: x1, y: y0 },
    e: { x: x1, y: midY },
    se: { x: x1, y: y1 },
    s: { x: midX, y: y1 },
    sw: { x: x0, y: y1 },
    w: { x: x0, y: midY },
    rotate: { x: midX, y: y0 - ROTATE_HANDLE_OFFSET },
  };
  const screen: Record<string, Point> = {};
  for (const key in local) {
    screen[key] = rotatePoint(local[key], frame.center, frame.angle);
  }
  return screen;
}

export function hitTestHandle(pos: Point, frame: SelectionFrame): string | null {
  const handles = getHandlePositions(frame);
  for (const key in handles) {
    if (distance(pos, handles[key]) <= HANDLE_HIT_RADIUS) return key;
  }
  return null;
}

export function isPointInsideSelectionFrame(pos: Point, frame: SelectionFrame): boolean {
  const local = frame.angle ? rotatePoint(pos, frame.center, -frame.angle) : pos;
  const PAD = 8;
  const b = frame.bbox;
  return (
    local.x >= b.x - PAD &&
    local.x <= b.x + b.w + PAD &&
    local.y >= b.y - PAD &&
    local.y <= b.y + b.h + PAD
  );
}
