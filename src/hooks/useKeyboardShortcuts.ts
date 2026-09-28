import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { openTextEditor } from '../tools/TextTool';
import { TextElement, ToolType } from '../elements/types';

const TOOL_SHORTCUT_MAP: Record<string, ToolType> = {
  v: 'selection',
  r: 'rectangle',
  d: 'diamond',
  o: 'ellipse',
  a: 'arrow',
  l: 'line',
  p: 'freedraw',
  t: 'text',
  e: 'eraser',
  '1': 'selection',
  '2': 'rectangle',
  '3': 'diamond',
  '4': 'ellipse',
  '5': 'arrow',
  '6': 'line',
  '7': 'freedraw',
  '8': 'text',
  '9': 'eraser',
  '0': 'eraser',
};

function isInputElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  const activeEl = document.activeElement as HTMLElement | null;
  return (
    el?.tagName === 'TEXTAREA' ||
    el?.tagName === 'INPUT' ||
    el?.isContentEditable === true ||
    activeEl?.tagName === 'TEXTAREA' ||
    activeEl?.tagName === 'INPUT' ||
    activeEl?.isContentEditable === true
  );
}

interface UseKeyboardShortcutsOptions {
  onToggleShortcuts: () => void;
}

export function useKeyboardShortcuts({ onToggleShortcuts }: UseKeyboardShortcutsOptions) {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const elements = useAppStore((s) => s.elements);
  const setElements = useAppStore((s) => s.setElements);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const setTool = useAppStore((s) => s.setTool);
  const togglePreview = useAppStore((s) => s.togglePreview);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const duplicateSelected = useAppStore((s) => s.duplicateSelected);
  const copySelected = useAppStore((s) => s.copySelected);
  const cutSelected = useAppStore((s) => s.cutSelected);
  const deleteSelected = useAppStore((s) => s.deleteSelected);
  const sendBackward = useAppStore((s) => s.sendBackward);
  const sendForward = useAppStore((s) => s.sendForward);
  const groupSelected = useAppStore((s) => s.groupSelected);
  const ungroupSelected = useAppStore((s) => s.ungroupSelected);
  const toggleLockSelected = useAppStore((s) => s.toggleLockSelected);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const saveToStorage = useAppStore((s) => s.saveToStorage);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never trigger canvas shortcuts while typing into text editor or inputs
      if (useAppStore.getState().editingText) return;
      if (isInputElement(e.target)) return;

      // Keyboard shortcuts modal toggle with '?'
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onToggleShortcuts();
        return;
      }

      // Toggle drawing mode with E if in wallpaper mode
      if (mode === 'wallpaper') {
        if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setMode('drawing');
          return;
        }
      }

      if (mode !== 'drawing') return;

      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      // Enter on single selected text element -> edit it like Excalidraw
      if (e.key === 'Enter' && !mod && !e.altKey && selectedIds.size === 1) {
        const selectedId = Array.from(selectedIds)[0];
        const selectedEl = elements.find((el) => el.id === selectedId);
        if (selectedEl && selectedEl.type === 'text' && !selectedEl.locked) {
          e.preventDefault();
          openTextEditor({ x: selectedEl.x, y: selectedEl.y }, selectedEl as TextElement);
          return;
        }
      }

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (mod && key === 'c') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          copySelected();
          return;
        }
      }
      if (mod && key === 'x') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          cutSelected();
          return;
        }
      }
      if (mod && key === 'v') {
        return;
      }
      if (mod && key === 'a') {
        e.preventDefault();
        const unlocked = elements.filter((el) => !el.locked).map((el) => el.id);
        setSelectedIds(unlocked);
        return;
      }
      if (mod && key === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else {
          groupSelected();
        }
        return;
      }
      if (mod && e.shiftKey && key === 'l') {
        e.preventDefault();
        toggleLockSelected();
        return;
      }
      if (mod && key === ']') {
        e.preventDefault();
        sendForward();
        return;
      }
      if (mod && key === '[') {
        e.preventDefault();
        sendBackward();
        return;
      }
      if (e.key === 'Escape') {
        if (selectedIds.size > 0) {
          setSelectedIds([]);
        } else {
          setMode('wallpaper');
        }
        return;
      }

      if (key === 'h' && !mod && !e.altKey) {
        e.preventDefault();
        togglePreview();
        return;
      }

      // Arrow keys nudge
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        selectedIds.size > 0
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        if (!e.repeat) {
          pushHistory();
        }
        setElements(
          elements.map((el) => {
            if (!selectedIds.has(el.id) || el.locked) return el;
            if ('points' in el && el.points) {
              return {
                ...el,
                points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              } as any;
            } else if ('x' in el) {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
              };
            }
            return el;
          })
        );
        if (!e.repeat) {
          saveToStorage();
        }
        return;
      }

      // Tool switching shortcuts
      if (!mod && !e.altKey && TOOL_SHORTCUT_MAP[key]) {
        setTool(TOOL_SHORTCUT_MAP[key]);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, elements, selectedIds, onToggleShortcuts]);
}
