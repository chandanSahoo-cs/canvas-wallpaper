import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { Point, TextElement } from '../elements/types';
import { newId, randomSeed } from '../lib/utils';
import { FONT_SIZE_MAP } from '../canvas/geometry';

let activeTextarea: HTMLTextAreaElement | null = null;

export class TextTool implements Tool {
  onPointerDown({ pos, rawPos, e }: ToolContext): void {
    e.preventDefault();
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
  // If an editor is already open, commit it first
  if (activeTextarea) {
    activeTextarea.blur();
  }

  const store = useAppStore.getState();
  const fontSize = FONT_SIZE_MAP[store.currentStrokeWidth] || 20;

  const textarea = document.createElement('textarea');
  activeTextarea = textarea;
  textarea.value = existingElement ? existingElement.text : '';

  const maxW = Math.max(160, window.innerWidth - screenPos.x - 20);
  const left = Math.min(screenPos.x, window.innerWidth - 180);

  Object.assign(textarea.style, {
    position: 'fixed',
    left: `${Math.max(10, left)}px`,
    top: `${Math.max(10, screenPos.y)}px`,
    font: `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    color: existingElement ? existingElement.strokeColor : store.currentStrokeColor,
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(4px)',
    border: '1.5px dashed #6366f1',
    borderRadius: '6px',
    outline: 'none',
    resize: 'both',
    minWidth: '160px',
    maxWidth: `${maxW}px`,
    minHeight: `${fontSize * 1.6}px`,
    zIndex: '100',
    padding: '4px 8px',
    lineHeight: '1.35',
    whiteSpace: 'pre',
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
  });

  document.body.appendChild(textarea);

  // Auto-resize height as user types
  const autoResize = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(fontSize * 1.6, textarea.scrollHeight)}px`;
  };
  textarea.addEventListener('input', autoResize);

  // Prevent canvas from stealing pointer events while interacting with the textarea
  textarea.addEventListener('pointerdown', (e) => e.stopPropagation());
  textarea.addEventListener('mousedown', (e) => e.stopPropagation());
  textarea.addEventListener('click', (e) => e.stopPropagation());
  textarea.addEventListener('dblclick', (e) => e.stopPropagation());

  let committed = false;
  let allowBlur = false;

  // Allow blur only after the initial click gesture has completed
  setTimeout(() => {
    allowBlur = true;
  }, 250);

  function commit(cancel = false) {
    if (committed) return;
    committed = true;
    activeTextarea = null;

    const text = textarea.value.trimEnd();
    if (textarea.parentNode) {
      document.body.removeChild(textarea);
    }

    if (cancel) {
      store.setTool('selection');
      return;
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

    store.setTool('selection');
  }

  // Prevent premature blur caused by initial canvas click
  textarea.addEventListener('blur', () => {
    if (!allowBlur) {
      setTimeout(() => {
        if (activeTextarea === textarea) {
          textarea.focus();
        }
      }, 10);
      return;
    }
    commit();
  });

  // Stop shortcuts from leaking to App.tsx while typing
  textarea.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commit();
    }
  });

  // Focus and select text
  setTimeout(() => {
    textarea.focus();
    if (existingElement) {
      textarea.select();
    }
    autoResize();
  }, 30);
}
