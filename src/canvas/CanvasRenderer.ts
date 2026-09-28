import rough from 'roughjs';
import { useAppStore } from '../store/useAppStore';
import {
  CanvasElement,
  Point,
} from '../elements/types';
import {
  getCenter,
  RotationOverlay,
} from './geometry';
import { getRoughDrawable, roughOptions } from './rough-cache';
import {
  drawArrow,
  drawFreedraw,
  drawText,
  drawImage,
} from './renderer/elementDrawing';
import {
  drawLockBadge,
  drawSelectionOverlays,
  drawMarquee,
} from './renderer/overlayDrawing';

type RoughCanvas = ReturnType<typeof rough.canvas>;

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rc: RoughCanvas;
  public onNeedRender?: () => void;

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
    rotationOverlay,
  }: {
    elements: CanvasElement[];
    draft: CanvasElement | null;
    selectedIds: Set<string>;
    zoom?: number;
    scrollOffset?: Point;
    marquee?: { start: Point; current: Point } | null;
    rotationOverlay?: RotationOverlay | null;
  }): void {
    const dpr = window.devicePixelRatio || 1;

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

    // Draw lock badges on unselected locked elements
    for (const el of elements) {
      if (el.locked && !selectedIds.has(el.id)) {
        drawLockBadge(this.ctx, el);
      }
    }

    // Draw selection handles and outlines
    drawSelectionOverlays(this.ctx, elements, selectedIds, rotationOverlay);

    // Draw marquee box if active
    if (marquee) {
      drawMarquee(this.ctx, marquee);
    }
  }

  private drawElement(el: CanvasElement): void {
    const editingText = useAppStore.getState().editingText;
    if (editingText?.elementId && el.id === editingText.elementId) {
      return;
    }

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
        const pts = el.points;
        if (pts.length === 2) {
          this.rc.line(pts[0].x, pts[0].y, pts[1].x, pts[1].y, roughOptions(el));
        } else if (pts.length > 2) {
          this.rc.linearPath(pts.map((p) => [p.x, p.y]), roughOptions(el));
        }
        break;
      }
      case 'arrow': {
        drawArrow(this.rc, el as CanvasElement & { points: Point[] });
        break;
      }
      case 'freedraw': {
        drawFreedraw(this.ctx, el as CanvasElement & { points: Point[] });
        break;
      }
      case 'text': {
        drawText(this.ctx, el);
        break;
      }
      case 'image': {
        drawImage(this.ctx, el, this.onNeedRender);
        break;
      }
    }

    this.ctx.restore();
  }
}
