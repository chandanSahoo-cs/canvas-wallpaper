import rough from 'roughjs';
import {
  CanvasElement,
  Point,
  TextElement,
  ImageElement,
} from '../elements/types';
import {
  getBBox,
  getCenter,
  getScreenBBox,
  computeSelectionFrame,
  ROTATE_HANDLE_OFFSET,
  FONT_SIZE_MAP,
} from './geometry';
import { getRoughDrawable, roughOptions } from './rough-cache';

type RoughCanvas = ReturnType<typeof rough.canvas>;

const imageElementCache = new Map<string, HTMLImageElement>();

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rc: RoughCanvas;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.rc = rough.canvas(canvas);
  }

  public resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  public render({
    elements,
    draft,
    selectedIds,
    zoom = 1,
    scrollOffset = { x: 0, y: 0 },
    marquee,
  }: {
    elements: CanvasElement[];
    draft: CanvasElement | null;
    selectedIds: Set<string>;
    zoom?: number;
    scrollOffset?: Point;
    marquee?: { start: Point; current: Point } | null;
  }): void {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    // Reset transform to identity and clear screen
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply camera transform: DPR + Camera Zoom & Pan Offset
    this.ctx.setTransform(
      dpr * zoom,
      0,
      0,
      dpr * zoom,
      -scrollOffset.x * zoom * dpr,
      -scrollOffset.y * zoom * dpr
    );

    // Draw all elements and draft
    const all = draft ? [...elements, draft] : elements;
    for (const el of all) {
      this.drawElement(el);
    }

    // Draw lock badges on locked elements
    for (const el of elements) {
      if (el.locked) {
        this.drawLockBadge(el);
      }
    }

    // Draw selection handles and outlines
    this.drawSelectionOverlays(elements, selectedIds);

    // Draw marquee box if active
    if (marquee) {
      this.drawMarquee(marquee);
    }
  }

  private drawElement(el: CanvasElement): void {
    this.ctx.save();
    this.ctx.globalAlpha = (el.opacity ?? 100) / 100;

    if (el.angle) {
      const c = getCenter(el);
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate(el.angle);
      this.ctx.translate(-c.x, -c.y);
    }

    switch (el.type) {
      case 'rectangle':
      case 'diamond':
      case 'ellipse': {
        const drawable = getRoughDrawable(el);
        if (drawable) {
          this.rc.draw(drawable);
        }
        break;
      }
      case 'line': {
        this.rc.line(
          el.points[0].x,
          el.points[0].y,
          el.points[1].x,
          el.points[1].y,
          roughOptions(el)
        );
        break;
      }
      case 'arrow': {
        this.drawArrow(el);
        break;
      }
      case 'freedraw': {
        this.drawFreedraw(el);
        break;
      }
      case 'text': {
        this.drawText(el);
        break;
      }
      case 'image': {
        this.drawImage(el);
        break;
      }
    }

    this.ctx.restore();
  }

  private drawArrow(el: CanvasElement & { points: [Point, Point] }): void {
    const [p0, p1] = el.points;
    const opts = roughOptions(el);
    this.rc.line(p0.x, p0.y, p1.x, p1.y, opts);
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const headLen = 10 + el.strokeWidth * 3;
    const a1 = angle + Math.PI - 0.5;
    const a2 = angle + Math.PI + 0.5;
    this.rc.line(p1.x, p1.y, p1.x + headLen * Math.cos(a1), p1.y + headLen * Math.sin(a1), opts);
    this.rc.line(p1.x, p1.y, p1.x + headLen * Math.cos(a2), p1.y + headLen * Math.sin(a2), opts);
  }

  private drawFreedraw(el: CanvasElement & { points: Point[] }): void {
    const pts = el.points;
    if (pts.length < 1) return;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = el.strokeWidth * 2.2;
    this.ctx.strokeStyle = el.strokeColor;
    this.ctx.beginPath();
    this.ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) {
      this.ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      const last = pts[pts.length - 1];
      this.ctx.lineTo(last.x, last.y);
    }
    this.ctx.stroke();
  }

  private drawText(el: TextElement): void {
    const fontSize = FONT_SIZE_MAP[el.strokeWidth] || 20;
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    this.ctx.fillStyle = el.strokeColor;
    this.ctx.textBaseline = 'top';

    const lines = el.text.split('\n');
    const lineHeight = fontSize * 1.3;
    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], el.x, el.y + i * lineHeight);
    }
  }

  private drawImage(el: ImageElement): void {
    let img = imageElementCache.get(el.dataUrl);
    if (!img) {
      img = new Image();
      img.src = el.dataUrl;
      img.onload = () => {
        // Redraw will pick it up on next frame
      };
      imageElementCache.set(el.dataUrl, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, el.x, el.y, el.width, el.height);
    }
  }

  private drawLockBadge(el: CanvasElement): void {
    const b = getScreenBBox(el);
    const x = b.x,
      y = b.y;
    this.ctx.save();
    this.ctx.fillStyle = '#9b9ba3';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.4;
    this.ctx.strokeRect(x - 3, y - 1, 6, 5);
    this.ctx.beginPath();
    this.ctx.arc(x, y - 1, 3, Math.PI, 0);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawSelectionOverlays(elements: CanvasElement[], selectedIds: Set<string>): void {
    const selectedMembers = elements.filter((el) => selectedIds.has(el.id));
    if (selectedMembers.length === 0) return;

    // Draw item outlines for multi-selection
    if (selectedMembers.length > 1) {
      for (const el of selectedMembers) {
        const b = getScreenBBox(el);
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(105, 101, 219, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
        this.ctx.restore();
      }
    }

    const frame = computeSelectionFrame(selectedMembers);
    if (!frame) return;

    const allLocked = selectedMembers.every((el) => el.locked);

    this.ctx.save();
    this.ctx.translate(frame.center.x, frame.center.y);
    this.ctx.rotate(frame.angle);
    this.ctx.translate(-frame.center.x, -frame.center.y);

    const b = frame.bbox;
    const PAD = 8;
    const x0 = b.x - PAD,
      y0 = b.y - PAD,
      x1 = b.x + b.w + PAD,
      y1 = b.y + b.h + PAD;
    const midX = (x0 + x1) / 2,
      midY = (y0 + y1) / 2;

    this.ctx.strokeStyle = allLocked ? '#9b9ba3' : '#6965db';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    this.ctx.setLineDash([]);

    if (!allLocked) {
      // Rotation stalk line
      this.ctx.beginPath();
      this.ctx.moveTo(midX, y0);
      this.ctx.lineTo(midX, y0 - ROTATE_HANDLE_OFFSET);
      this.ctx.stroke();

      // 8 Resize handle boxes
      const handlePts = [
        [x0, y0],
        [midX, y0],
        [x1, y0],
        [x1, midY],
        [x1, y1],
        [midX, y1],
        [x0, y1],
        [x0, midY],
      ];
      this.ctx.fillStyle = '#ffffff';
      for (const [hx, hy] of handlePts) {
        this.ctx.fillRect(hx - 4, hy - 4, 8, 8);
        this.ctx.strokeRect(hx - 4, hy - 4, 8, 8);
      }

      // Rotation circle handle
      this.ctx.beginPath();
      this.ctx.arc(midX, y0 - ROTATE_HANDLE_OFFSET, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawMarquee(marquee: { start: Point; current: Point }): void {
    const x0 = Math.min(marquee.start.x, marquee.current.x);
    const y0 = Math.min(marquee.start.y, marquee.current.y);
    const w = Math.abs(marquee.current.x - marquee.start.x);
    const h = Math.abs(marquee.current.y - marquee.start.y);

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(105, 101, 219, 0.08)';
    this.ctx.strokeStyle = '#6965db';
    this.ctx.lineWidth = 1;
    this.ctx.fillRect(x0, y0, w, h);
    this.ctx.strokeRect(x0, y0, w, h);
    this.ctx.restore();
  }
}
