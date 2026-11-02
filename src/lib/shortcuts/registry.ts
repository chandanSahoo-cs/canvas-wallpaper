/**
 * Single source of truth for keyboard shortcut bindings and descriptions across PaperTab.
 * Shared between ShortcutsDialog, OnboardingTour, and UI tooltips to prevent copy drift.
 */

export interface ShortcutBinding {
  keys: string[];
  description: string;
  category: "draw" | "edit" | "nav" | "layers";
}

export interface ShortcutSection {
  title: string;
  category: "draw" | "edit" | "nav" | "layers";
  shortcuts: { keys: string[]; description: string }[];
}

export const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "Drawing Tools",
    category: "draw",
    shortcuts: [
      { keys: ["V", "1"], description: "Selection tool" },
      { keys: ["R", "2"], description: "Rectangle shape" },
      { keys: ["D", "3"], description: "Diamond shape" },
      { keys: ["O", "4"], description: "Ellipse / Circle" },
      { keys: ["A", "5"], description: "Arrow" },
      { keys: ["L", "6"], description: "Straight Line" },
      { keys: ["P", "7"], description: "Freehand Pencil" },
      { keys: ["T", "8"], description: "Text element" },
      { keys: ["E", "9", "0"], description: "Eraser tool" },
      { keys: ["Shift", "Drag"], description: "Keep 1:1 aspect ratio / 15° snap" },
      { keys: ["Alt", "Drag"], description: "Draw / resize from center" },
    ],
  },
  {
    title: "Edit & Clipboard",
    category: "edit",
    shortcuts: [
      { keys: ["Ctrl", "C"], description: "Copy selected element(s)" },
      { keys: ["Ctrl", "V"], description: "Paste element(s) or images" },
      { keys: ["Ctrl", "X"], description: "Cut selected element(s)" },
      { keys: ["Ctrl", "D"], description: "Duplicate selection" },
      { keys: ["Alt", "Drag"], description: "Duplicate element on drag" },
      { keys: ["Ctrl", "A"], description: "Select all unlocked elements" },
      { keys: ["Del"], description: "Delete selected element(s)" },
      { keys: ["Ctrl", "Z"], description: "Undo last action" },
      { keys: ["Ctrl", "Y"], description: "Redo action (or Ctrl+Shift+Z)" },
    ],
  },
  {
    title: "Navigation & View",
    category: "nav",
    shortcuts: [
      { keys: ["Space", "Drag"], description: "Pan across canvas" },
      { keys: ["Ctrl", "Scroll"], description: "Zoom in / out" },
      { keys: ["Ctrl", "+", "-"], description: "Zoom in / out" },
      { keys: ["Ctrl", "0"], description: "Reset zoom & center canvas to (0,0)" },
      { keys: ["Shift", "0"], description: "Center canvas to (0,0)" },
      { keys: ["Shift", "Scroll"], description: "Pan horizontally" },
      { keys: ["M"], description: "Open Library & Search" },
      { keys: ["I"], description: "Toggle Web Capture Inbox" },
      { keys: ["H"], description: "Toggle clean preview (hide UI)" },
      { keys: ["B"], description: "Toggle wallpaper boundary marker" },
      { keys: ["E"], description: "Enter Drawing mode (Wallpaper)" },
      { keys: ["Esc"], description: "Exit Drawing mode / Deselect" },
      { keys: ["?"], description: "Open shortcuts cheatsheet" },
    ],
  },
  {
    title: "Layers & Groups",
    category: "layers",
    shortcuts: [
      { keys: ["Arrow keys"], description: "Nudge element 1px (Shift for 10px)" },
      { keys: ["Ctrl", "G"], description: "Group selected elements" },
      { keys: ["Ctrl", "Shift", "G"], description: "Ungroup selected elements" },
      { keys: ["Ctrl", "Shift", "L"], description: "Lock or unlock element" },
      { keys: ["Shift", "H"], description: "Flip selected horizontally" },
      { keys: ["Shift", "V"], description: "Flip selected vertically" },
      { keys: ["Ctrl", "]"], description: "Bring forward" },
      { keys: ["Ctrl", "["], description: "Send backward" },
    ],
  },
];
