import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { createElement } from '../elements/factory';
import { CanvasElement, ToolType, Point } from '../elements/types';
import { distance } from '../canvas/geometry';

export class LineTool implements Tool {
  private type: 'line' | 'arrow';
  private startPos: Point | null = null;

  constructor(type: 'line' | 'arrow') {
    this.type = type;
  }

  onPointerDown({ pos, e, canvas }: ToolContext): void {
    canvas.setPointerCapture(e.pointerId);
    this.startPos = pos;
    const store = useAppStore.getState();

    const draft = createElement(this.type, pos, {
      strokeColor: store.currentStrokeColor,
      fillColor: store.currentFillColor,
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
    if (!draft || !('points' in draft)) return;

    let target = pos;
    // Shift constraint for 15-degree angle snap
    if (e.shiftKey) {
      const dx = pos.x - this.startPos.x;
      const dy = pos.y - this.startPos.y;
      const dist = distance(this.startPos, pos);
      let angle = Math.atan2(dy, dx);
      const step = Math.PI / 12; // 15 degrees
      angle = Math.round(angle / step) * step;
      target = {
        x: this.startPos.x + dist * Math.cos(angle),
        y: this.startPos.y + dist * Math.sin(angle),
      };
    }

    let p0 = this.startPos;
    let p1 = target;

    if (e.altKey) {
      // Alt key: draw line symmetrically from center outward (Excalidraw standard)
      const dx = target.x - this.startPos.x;
      const dy = target.y - this.startPos.y;
      p0 = { x: this.startPos.x - dx, y: this.startPos.y - dy };
      p1 = { x: this.startPos.x + dx, y: this.startPos.y + dy };
    }

    store.setDraft({
      ...draft,
      points: [p0, p1],
    } as CanvasElement);
  }

  onPointerUp(): void {
    const store = useAppStore.getState();
    const draft = store.draft;
    this.startPos = null;

    if (!draft || !('points' in draft)) {
      store.setDraft(null);
      return;
    }

    if (distance(draft.points[0], draft.points[1]) < 4) {
      store.setDraft(null);
      return;
    }

    store.pushHistory();
    store.setElements([...store.elements, draft]);
    store.setSelectedIds(new Set([draft.id]));
    store.setTool('selection');
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
