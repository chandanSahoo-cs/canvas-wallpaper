import React, { useEffect } from "react";
import { X, Command, Compass } from "lucide-react";
import { useOnboardingStore } from "../store/useOnboardingStore";

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
    title: "Drawing Tools",
    shortcuts: [
      { keys: ["V", "1"], description: "Selection tool" },
      { keys: ["R", "2"], description: "Rectangle shape" },
      { keys: ["D", "3"], description: "Diamond shape" },
      { keys: ["O", "4"], description: "Ellipse / Circle" },
      { keys: ["A", "5"], description: "Arrow" },
      { keys: ["L", "6"], description: "Straight Line" },
      { keys: ["P", "7"], description: "Freehand Pencil" },
      { keys: ["T", "8"], description: "Text element" },
      { keys: ["E", "9"], description: "Eraser tool" },
      {
        keys: ["Shift", "Drag"],
        description: "Keep 1:1 aspect ratio / 15° snap",
      },
      { keys: ["Alt", "Drag"], description: "Draw / resize from center" },
    ],
  },
  {
    title: "Edit & Clipboard",
    shortcuts: [
      { keys: ["Ctrl", "C"], description: "Copy selected element(s)" },
      { keys: ["Ctrl", "V"], description: "Paste element(s) or images" },
      { keys: ["Ctrl", "X"], description: "Cut selected element(s)" },
      { keys: ["Ctrl", "D"], description: "Duplicate selection" },
      { keys: ["Alt", "Drag"], description: "Duplicate element on drag" },
      { keys: ["Del"], description: "Delete selected element(s)" },
      { keys: ["Ctrl", "Z"], description: "Undo last action" },
      { keys: ["Ctrl", "Y"], description: "Redo action" },
    ],
  },
  {
    title: "Navigation & View",
    shortcuts: [
      { keys: ["Space", "Drag"], description: "Pan across canvas" },
      { keys: ["Ctrl", "Scroll"], description: "Zoom in / out" },
      { keys: ["Ctrl", "+", "-"], description: "Zoom in / out" },
      { keys: ["Ctrl", "0"], description: "Reset zoom & center canvas to (0,0)" },
      { keys: ["Shift", "0"], description: "Center canvas to (0,0)" },
      { keys: ["Shift", "Scroll"], description: "Pan horizontally" },
      { keys: ["H"], description: "Toggle clean preview (hide UI)" },
      { keys: ["B"], description: "Toggle wallpaper boundary marker" },
      { keys: ["E"], description: "Enter Drawing mode (Wallpaper)" },
      { keys: ["Esc"], description: "Exit Drawing mode / Deselect" },
      { keys: ["?"], description: "Open this shortcuts cheatsheet" },
    ],
  },
  {
    title: "Layers & Groups",
    shortcuts: [
      {
        keys: ["Arrow keys"],
        description: "Nudge element 1px (Shift for 10px)",
      },
      { keys: ["Ctrl", "G"], description: "Group selected elements" },
      {
        keys: ["Ctrl", "Shift", "G"],
        description: "Ungroup selected elements",
      },
      { keys: ["Ctrl", "Shift", "L"], description: "Lock or unlock element" },
      { keys: ["Shift", "H"], description: "Flip selected horizontally" },
      { keys: ["Shift", "V"], description: "Flip selected vertically" },
      { keys: ["Ctrl", "]"], description: "Bring forward" },
      { keys: ["Ctrl", "["], description: "Send backward" },
    ],
  },
];

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface text-ink border-2 border-line rounded-sk-lg p-6 w-full max-w-2xl shadow-hard max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-line shrink-0">
          <div>
            <h2 className="font-hand text-lg font-bold text-ink leading-tight">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs font-sans text-muted mt-0.5">
              Quick keyboard controls to navigate and draw
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sk-sm text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: 2-Column Grid */}
        <div className="overflow-y-auto pr-1 py-4 grid grid-cols-1 md:grid-cols-2 gap-5 select-none">
          {SHORTCUT_SECTIONS.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-2">
              <div className="text-xs font-hand font-bold text-muted px-1">
                {sec.title}
              </div>
              <div className="flex flex-col bg-paper border-2 border-line rounded-sk overflow-hidden">
                {sec.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 text-xs border-b border-line/20 last:border-0"
                  >
                    <span className="font-sans text-ink">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-1.5 py-0.5 bg-surface border-2 border-line rounded-sk-sm text-[11px] font-mono text-ink shadow-hard-sm"
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
        <div className="pt-3 border-t-2 border-line flex items-center justify-between text-xs text-muted shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-sans">
              <Command className="w-3.5 h-3.5 text-muted" />
              <span>Use Cmd instead of Ctrl on macOS</span>
            </div>
            <button
              onClick={() => {
                onClose();
                useOnboardingStore.getState().resetTour();
              }}
              className="flex items-center gap-1.5 font-hand font-bold text-ink/80 hover:text-ink cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-brand-blue" />
              <span>Feature Tour</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
