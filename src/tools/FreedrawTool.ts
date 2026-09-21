import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { createElement } from '../elements/factory';
import { CanvasElement } from '../elements/types';
import { distance } from '../canvas/geometry';

export class FreedrawTool implements Tool {
  private active = false;

  onPointerDown({ pos, e, canvas }: ToolContext): void {
    canvas.setPointerCapture(e.pointerId);
    this.active = true;
    const store = useAppStore.getState();

    const draft = createElement('freedraw', pos, {
      strokeColor: store.currentStrokeColor,
      fillColor: 'transparent',
      strokeWidth: store.currentStrokeWidth,
      opacity: store.currentOpacity,
    });

    store.setDraft(draft);
  }

  onPointerMove({ pos }: ToolContext): void {
    if (!this.active) return;
    const store = useAppStore.getState();
    const draft = store.draft;
    if (!draft || draft.type !== 'freedraw') return;

    const last = draft.points[draft.points.length - 1];
    if (distance(pos, last) > 2.5) {
      store.setDraft({
        ...draft,
        points: [...draft.points, pos],
      } as CanvasElement);
    }
  }

  onPointerUp(): void {
    this.active = false;
    const store = useAppStore.getState();
    const draft = store.draft;

    if (!draft || draft.type !== 'freedraw' || draft.points.length === 0) {
      store.setDraft(null);
      return;
    }

    store.pushHistory();
    store.setElements([...store.elements, draft]);
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
