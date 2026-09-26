import React, { useEffect, useRef, useState } from 'react';
import { Point } from '../elements/types';
import { TextEditorState } from '../store/useAppStore';
import { getFontFamilyString } from '../canvas/geometry';

interface InlineTextEditorProps {
  data: TextEditorState;
  zoom: number;
  scrollOffset: Point;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d');
  }
  return measureCtx;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  data,
  zoom,
  scrollOffset,
  onCommit,
  onCancel,
}) => {
  const [text, setText] = useState(data.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCommittedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());

  // Focus and select all text if editing existing element; ensure reliable focus on mount
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      if (data.elementId && data.text) {
        el.select();
      } else {
        el.selectionStart = el.selectionEnd = el.value.length;
      }
    }
    const timer = setTimeout(() => {
      if (textareaRef.current && document.activeElement !== textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 20);
    return () => clearTimeout(timer);
  }, []);

  const commit = (cancel = false) => {
    if (isCommittedRef.current) return;
    isCommittedRef.current = true;
    if (cancel) {
      onCancel();
    } else {
      onCommit(text);
    }
  };

  const handleBlur = () => {
    // Prevent immediate blur from the opening mouseup/click event
    if (Date.now() - mountedAtRef.current < 150) {
      textareaRef.current?.focus();
      return;
    }
    commit(false);
  };

  // Compute screen coordinates and scaled font metrics
  const screenX = (data.canvasX - scrollOffset.x) * zoom;
  const screenY = (data.canvasY - scrollOffset.y) * zoom;
  const scaledFontSize = Math.max(12, data.fontSize * zoom);
  const fontFamily = getFontFamilyString(data.fontFamily);
  const lineHeight = scaledFontSize * 1.25;

  // Measure text to dynamically fit width and height like Excalidraw
  const lines = text.split('\n');
  const ctx = getMeasureCtx();
  let maxLineWidth = 0;
  if (ctx) {
    ctx.font = `${scaledFontSize}px ${fontFamily}`;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    }
  } else {
    maxLineWidth = Math.max(...lines.map((l) => l.length), 1) * (scaledFontSize * 0.6);
  }

  // Minimum width gives room for blinking caret at start
  const minWidth = Math.max(32, Math.ceil(scaledFontSize * 1.2));
  const editorWidth = Math.max(minWidth, Math.ceil(maxLineWidth + 16));
  const editorHeight = Math.max(lineHeight, lines.length * lineHeight + 4);

  const screenCenterX = screenX + editorWidth / 2;
  const screenCenterY = screenY + editorHeight / 2;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${screenCenterX}px`,
    top: `${screenCenterY}px`,
    width: `${editorWidth}px`,
    height: `${editorHeight}px`,
    font: `${scaledFontSize}px ${fontFamily}`,
    fontFamily,
    fontSize: `${scaledFontSize}px`,
    lineHeight: '1.25',
    color: data.strokeColor || '#1e1e1e',
    caretColor: data.strokeColor || '#1e1e1e',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    padding: '0px',
    margin: '0px',
    resize: 'none',
    overflow: 'hidden',
    whiteSpace: 'pre',
    wordBreak: 'normal',
    boxSizing: 'content-box',
    zIndex: 50,
    transformOrigin: 'center center',
    transform: `translate(-50%, -50%) ${data.angle ? `rotate(${data.angle}rad)` : ''}`.trim(),
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      style={style}
      spellCheck={false}
      autoCapitalize="none"
      autoComplete="off"
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        // Isolate key events from global shortcuts
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (e.key === 'Escape') {
          e.preventDefault();
          // In Excalidraw, Escape commits whatever was typed (empty text will be cleaned up on commit)
          commit(false);
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          commit(false);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const start = e.currentTarget.selectionStart;
          const end = e.currentTarget.selectionEnd;
          const next = text.substring(0, start) + '  ' + text.substring(end);
          setText(next);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
            }
          });
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
};
