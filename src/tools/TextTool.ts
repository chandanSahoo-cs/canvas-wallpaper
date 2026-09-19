import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { Point, TextElement } from '../elements/types';
import { newId, randomSeed } from '../lib/utils';
import { FONT_SIZE_MAP } from '../canvas/geometry';

export class TextTool implements Tool {
  onPointerDown({ pos, rawPos }: ToolContext): void {
    openTextEditor(pos, rawPos);
  }

  onPointerMove(): void {}
  onPointerUp(): void {}

  getCursor(): string {
    return 'text';
  }
}

export function openTextEditor(
  canvasPos: Point,
  screenPos: Point,
  existingElement?: TextElement
): void {
  const store = useAppStore.getState();
  const fontSize = FONT_SIZE_MAP[store.currentStrokeWidth] || 20;

  const textarea = document.createElement('textarea');
  textarea.value = existingElement ? existingElement.text : '';
  Object.assign(textarea.style, {
    position: 'fixed',
    left: screenPos.x + 'px',
    top: screenPos.y + 'px',
    font: `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`,
    color: existingElement ? existingElement.strokeColor : store.currentStrokeColor,
    background: 'transparent',
    border: '1px dashed #6965db',
    outline: 'none',
    resize: 'both',
    minWidth: '140px',
    minHeight: `${fontSize * 1.5}px`,
    zIndex: '50',
    padding: '4px 6px',
    lineHeight: '1.3',
    whiteSpace: 'pre',
  });

  document.body.appendChild(textarea);
  textarea.focus();

  let committed = false;
  function commit() {
    if (committed) return;
    committed = true;
    const text = textarea.value.trimEnd();
    if (textarea.parentNode) {
      document.body.removeChild(textarea);
    }

    if (text) {
      store.pushHistory();
      if (existingElement) {
        store.updateElement(existingElement.id, { text });
      } else {
        const el: TextElement = {
          id: newId(),
          type: 'text',
          angle: 0,
          locked: false,
          groupIds: [],
          x: canvasPos.x,
          y: canvasPos.y,
          text,
          strokeColor: store.currentStrokeColor,
          fillColor: 'transparent',
          strokeWidth: store.currentStrokeWidth,
          opacity: store.currentOpacity,
          seed: randomSeed(),
        };
        store.setElements([...store.elements, el]);
        store.setSelectedIds([el.id]);
      }
      store.saveToStorage();
    } else if (existingElement) {
      // Empty text deletes the element
      store.pushHistory();
      store.setElements(store.elements.filter((e) => e.id !== existingElement.id));
      store.saveToStorage();
    }
    // Stay on current tool or switch to selection
    store.setTool('selection');
  }

  textarea.addEventListener('blur', commit);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      committed = true;
      if (textarea.parentNode) document.body.removeChild(textarea);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      textarea.blur();
    }
  });
}
