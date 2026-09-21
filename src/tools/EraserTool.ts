import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { elementContains, rotatePoint, getCenter } from '../canvas/geometry';
import { CanvasElement } from '../elements/types';

export class EraserTool implements Tool {
  private erasing = false;
  private historyPushed = false;

  onPointerDown({ pos, e, canvas }: ToolContext): void {
    canvas.setPointerCapture(e.pointerId);
    this.erasing = true;
    this.historyPushed = false;
    this.eraseAt(pos);
  }

  onPointerMove({ pos }: ToolContext): void {
    if (this.erasing) {
      this.eraseAt(pos);
    }
  }

  onPointerUp(): void {
    this.erasing = false;
    this.historyPushed = false;
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
    }
  }

  getCursor(): string {
    return 'cell';
  }
}
