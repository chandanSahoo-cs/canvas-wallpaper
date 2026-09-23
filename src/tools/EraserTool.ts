import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { elementContains, rotatePoint, getCenter, distance } from '../canvas/geometry';
import { CanvasElement, Point } from '../elements/types';

export class EraserTool implements Tool {
  private erasing = false;
  private historyPushed = false;
  private lastPos: Point | null = null;

  onPointerDown({ pos, e, canvas }: ToolContext): void {
    canvas.setPointerCapture(e.pointerId);
    this.erasing = true;
    this.historyPushed = false;
    this.lastPos = pos;
    this.eraseAt(pos);
  }

  onPointerMove({ pos }: ToolContext): void {
    if (this.erasing && this.lastPos) {
      const dist = distance(this.lastPos, pos);
      // Interpolate along the trail so fast mouse swipes don't skip elements (Excalidraw model)
      const steps = Math.max(1, Math.ceil(dist / 6));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const interPos = {
          x: this.lastPos.x + (pos.x - this.lastPos.x) * t,
          y: this.lastPos.y + (pos.y - this.lastPos.y) * t,
        };
        this.eraseAt(interPos);
      }
      this.lastPos = pos;
    }
  }

  onPointerUp(): void {
    this.erasing = false;
    this.historyPushed = false;
    this.lastPos = null;
    useAppStore.getState().saveToStorage();
  }

  onPointerCancel(): void {
    this.onPointerUp();
  }

  private eraseAt(pos: { x: number; y: number }): void {
    const store = useAppStore.getState();
    const { elements } = store;

    let hit: CanvasElement | null = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const local = el.angle ? rotatePoint(pos, getCenter(el), -el.angle) : pos;
      if (elementContains(el, local) && !el.locked) {
        hit = el;
        break;
      }
    }

    if (hit) {
      if (!this.historyPushed) {
        store.pushHistory();
        this.historyPushed = true;
      }
      store.setElements(elements.filter((e) => e.id !== hit!.id));
      if (store.selectedIds.has(hit.id)) {
        const nextSelected = new Set(store.selectedIds);
        nextSelected.delete(hit.id);
        store.setSelectedIds(nextSelected);
      }
    }
  }

  getCursor(): string {
    return 'cell';
  }
}
