import React, { useEffect } from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'Drawing Tools',
    shortcuts: [
      { keys: ['V', '1'], description: 'Selection tool' },
      { keys: ['R', '2'], description: 'Rectangle shape' },
      { keys: ['D', '3'], description: 'Diamond shape' },
      { keys: ['O', '4'], description: 'Ellipse / Circle' },
      { keys: ['A', '5'], description: 'Arrow' },
      { keys: ['L', '6'], description: 'Straight Line' },
      { keys: ['P', '7'], description: 'Freehand Pencil' },
      { keys: ['T', '8'], description: 'Text element' },
      { keys: ['E', '9'], description: 'Eraser tool' },
      { keys: ['Shift', 'Drag'], description: 'Keep 1:1 aspect ratio / 15° snap' },
      { keys: ['Alt', 'Drag'], description: 'Draw / resize from center' },
    ],
  },
  {
    title: 'Edit & Clipboard',
    shortcuts: [
      { keys: ['Ctrl', 'C'], description: 'Copy selected element(s)' },
      { keys: ['Ctrl', 'V'], description: 'Paste element(s) or images' },
      { keys: ['Ctrl', 'X'], description: 'Cut selected element(s)' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selection' },
      { keys: ['Alt', 'Drag'], description: 'Duplicate element on drag' },
      { keys: ['Del'], description: 'Delete selected element(s)' },
      { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
      { keys: ['Ctrl', 'Y'], description: 'Redo action' },
    ],
  },
  {
    title: 'Navigation & View',
    shortcuts: [
      { keys: ['Space', 'Drag'], description: 'Pan across canvas' },
      { keys: ['Ctrl', 'Scroll'], description: 'Zoom in / out' },
      { keys: ['Shift', 'Scroll'], description: 'Pan horizontally' },
      { keys: ['H'], description: 'Toggle clean preview (hide UI)' },
      { keys: ['E'], description: 'Enter Drawing mode (Wallpaper)' },
      { keys: ['Esc'], description: 'Exit Drawing mode / Deselect' },
      { keys: ['?'], description: 'Open this shortcuts cheatsheet' },
    ],
  },
  {
    title: 'Layers & Groups',
    shortcuts: [
      { keys: ['Arrow keys'], description: 'Nudge element 1px (Shift for 10px)' },
      { keys: ['Ctrl', 'G'], description: 'Group selected elements' },
      { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup selected elements' },
      { keys: ['Ctrl', 'Shift', 'L'], description: 'Lock or unlock element' },
      { keys: ['Ctrl', ']'], description: 'Bring forward' },
      { keys: ['Ctrl', '['], description: 'Send backward' },
    ],
  },
];

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-neutral-200 text-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">Keyboard Shortcuts</h2>
              <p className="text-xs text-neutral-500">Quick controls to boost your workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: 2-Column Grid */}
        <div className="overflow-y-auto pr-1 py-4 grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
          {SHORTCUT_SECTIONS.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {sec.title}
              </div>
              <div className="flex flex-col gap-1.5 bg-neutral-50/80 border border-neutral-200/60 rounded-2xl p-2.5">
                {sec.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-1.5 rounded-lg text-xs"
                  >
                    <span className="text-neutral-700">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 bg-white border border-neutral-200/90 rounded-md text-[11px] font-mono font-medium text-neutral-800 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Command className="w-3.5 h-3.5" />
            <span>Use Cmd instead of Ctrl on macOS</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
