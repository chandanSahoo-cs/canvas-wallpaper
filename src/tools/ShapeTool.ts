import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { createElement } from '../elements/factory';
import { CanvasElement, ToolType, Point } from '../elements/types';
import { normBox } from '../canvas/geometry';

export class ShapeTool implements Tool {
  private type: ToolType;
  private startPos: Point | null = null;

  constructor(type: ToolType) {
    this.type = type;
  }

  onPointerDown({ pos, e, canvas }: ToolContext): void {
    canvas.setPointerCapture(e.pointerId);
    this.startPos = pos;
    const store = useAppStore.getState();

    const draft = createElement(this.type, pos, {
      strokeColor: store.currentStrokeColor,
      fillColor: store.currentFillColor,
      fillStyle: store.currentFillStyle,
      strokeWidth: store.currentStrokeWidth,
      strokeStyle: store.currentStrokeStyle,
      roughness: store.currentRoughness,
      opacity: store.currentOpacity,
    });

    store.setDraft(draft);
  }

  onPointerMove({ pos, e }: ToolContext): void {
    if (!this.startPos) return;
    const store = useAppStore.getState();
    const draft = store.draft;
    if (!draft || !('width' in draft)) return;

    let width = pos.x - this.startPos.x;
    let height = pos.y - this.startPos.y;

    // Shift key constraint to keep 1:1 aspect ratio (square / circle)
    if (e.shiftKey) {
      const size = Math.max(Math.abs(width), Math.abs(height));
      width = size * Math.sign(width || 1);
      height = size * Math.sign(height || 1);
    }

    store.setDraft({
      ...draft,
      width,
      height,
    } as CanvasElement);
  }

  onPointerUp(): void {
    const store = useAppStore.getState();
    const draft = store.draft;
    this.startPos = null;

    if (!draft || !('width' in draft)) {
      store.setDraft(null);
      return;
    }

    // Ignore tiny accidental clicks (< 3px)
    if (Math.abs(draft.width) < 3 && Math.abs(draft.height) < 3) {
      store.setDraft(null);
      return;
    }

    const nb = normBox(draft);
    const finalized: CanvasElement = {
      ...draft,
      x: nb.x,
      y: nb.y,
      width: nb.w,
      height: nb.h,
    } as CanvasElement;

    store.pushHistory();
    store.setElements([...store.elements, finalized]);
    store.setSelectedIds(new Set());
    store.setDraft(null);
    store.saveToStorage();
  }

  onPointerCancel(): void {
    this.onPointerUp();
  }

  getCursor(): string {
    return 'crosshair';
  }
}
