import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Point } from '../elements/types';
import { TextEditorState } from '../store/useAppStore';

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

  // Focus and select all text if editing existing element
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      if (data.elementId && data.text) {
        textareaRef.current.select();
      }
    }
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

  // Compute screen coordinates and scaled font metrics
  const screenX = (data.canvasX - scrollOffset.x) * zoom;
  const screenY = (data.canvasY - scrollOffset.y) * zoom;
  const scaledFontSize = Math.max(12, data.fontSize * zoom);
  const lineHeight = scaledFontSize * 1.3;

  // Measure text to dynamically fit width and height like Excalidraw
  const lines = text.split('\n');
  const ctx = getMeasureCtx();
  let maxLineWidth = 0;
  if (ctx) {
    ctx.font = `${scaledFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    }
  } else {
    maxLineWidth = Math.max(...lines.map((l) => l.length), 1) * (scaledFontSize * 0.6);
  }

  // Minimum width gives room for blinking caret at start
  const minWidth = Math.max(28, Math.ceil(scaledFontSize * 1.2));
  const editorWidth = Math.max(minWidth, Math.ceil(maxLineWidth + 12));
  const editorHeight = Math.max(lineHeight, lines.length * lineHeight);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${screenX}px`,
    top: `${screenY}px`,
    width: `${editorWidth}px`,
    height: `${editorHeight}px`,
    font: `${scaledFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    lineHeight: '1.3',
    color: data.strokeColor || '#1e1e1e',
    caretColor: data.strokeColor || '#1e1e1e',
    background: 'transparent',
    border: '1px dashed rgba(99, 102, 241, 0.75)',
    borderRadius: '2px',
    outline: 'none',
    boxShadow: 'none',
    padding: '0px 2px',
    margin: '0px',
    resize: 'none',
    overflow: 'hidden',
    whiteSpace: 'pre',
    wordBreak: 'normal',
    boxSizing: 'content-box',
    zIndex: 50,
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      style={style}
      spellCheck={false}
      autoCapitalize="none"
      autoComplete="off"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => commit(false)}
      onKeyDown={(e) => {
        // Isolate all key events from global shortcuts
        e.stopPropagation();

        if (e.key === 'Escape') {
          e.preventDefault();
          commit(true);
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
