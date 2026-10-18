import React, { useRef } from "react";
import {
  Pointer,
  Square,
  Diamond,
  Circle,
  MoveUpRight,
  Minus,
  Pencil,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Check,
  Eye,
  Image as ImageIcon,
  Keyboard,
  SquareDashed,
} from "lucide-react";
import { insertImageFromFile } from "../lib/imageInsert";
import { useAppStore } from "../store/useAppStore";
import { ToolType } from "../elements/types";
import { cn } from "../lib/utils";
import { ExportMenu } from "./toolbar/ExportMenu";
import { ZoomControls } from "./toolbar/ZoomControls";

interface ToolbarProps {
  onOpenShortcuts?: () => void;
}

const TOOLS: {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}[] = [
  {
    id: "selection",
    label: "Select",
    icon: <Pointer className="w-4 h-4" />,
    shortcut: "V",
  },
  {
    id: "rectangle",
    label: "Rectangle",
    icon: <Square className="w-4 h-4" />,
    shortcut: "R",
  },
  {
    id: "diamond",
    label: "Diamond",
    icon: <Diamond className="w-4 h-4" />,
    shortcut: "D",
  },
  {
    id: "ellipse",
    label: "Ellipse",
    icon: <Circle className="w-4 h-4" />,
    shortcut: "O",
  },
  {
    id: "arrow",
    label: "Arrow",
    icon: <MoveUpRight className="w-4 h-4" />,
    shortcut: "A",
  },
  {
    id: "line",
    label: "Line",
    icon: <Minus className="w-4 h-4 rotate-45" />,
    shortcut: "L",
  },
  {
    id: "freedraw",
    label: "Draw",
    icon: <Pencil className="w-4 h-4" />,
    shortcut: "P",
  },
  {
    id: "text",
    label: "Text",
    icon: <Type className="w-4 h-4" />,
    shortcut: "T",
  },
  {
    id: "eraser",
    label: "Eraser",
    icon: <Eraser className="w-4 h-4" />,
    shortcut: "E",
  },
];

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenShortcuts }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const currentTool = useAppStore((s) => s.currentTool);
  const setTool = useAppStore((s) => s.setTool);
  const setMode = useAppStore((s) => s.setMode);
  const togglePreview = useAppStore((s) => s.togglePreview);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const history = useAppStore((s) => s.history);
  const future = useAppStore((s) => s.future);
  const showBoundaryMarker = useAppStore((s) => s.showBoundaryMarker);
  const toggleBoundaryMarker = useAppStore((s) => s.toggleBoundaryMarker);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-xl border border-neutral-200/80 shadow-xl rounded-2xl p-1.5 flex items-center gap-1 select-none">
      {/* Cluster 1: Primary Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            title={`${t.label} (${t.shortcut})`}
            onClick={() => setTool(t.id)}
            className={cn(
              "w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer",
              currentTool === t.id
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95",
            )}
          >
            {t.icon}
          </button>
        ))}

        {/* Insert Image Button */}
        <button
          title="Insert Image (or paste with Ctrl+V)"
          onClick={() => imageInputRef.current?.click()}
          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await insertImageFromFile(file);
              e.target.value = "";
            }
          }}
        />
      </div>

      <div className="w-px h-5 bg-neutral-200 mx-1 shrink-0" />

      {/* Cluster 2: History (Undo/Redo) & Zoom */}
      <div className="flex items-center gap-0.5">
        <button
          title="Undo (Ctrl+Z)"
          disabled={history.length === 0}
          onClick={undo}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150",
            history.length === 0
              ? "opacity-25 cursor-not-allowed text-neutral-400"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 cursor-pointer",
          )}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          title="Redo (Ctrl+Shift+Z)"
          disabled={future.length === 0}
          onClick={redo}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150",
            future.length === 0
              ? "opacity-25 cursor-not-allowed text-neutral-400"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 cursor-pointer",
          )}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <ZoomControls />
      </div>

      <div className="w-px h-5 bg-neutral-200 mx-1 shrink-0" />

      {/* Cluster 3: Utilities + Done */}
      <div className="flex items-center gap-0.5">
        <ExportMenu />

        {/* Keyboard Shortcuts — utility, visually secondary */}
        {onOpenShortcuts && (
          <button
            title="Keyboard Shortcuts (?)"
            onClick={onOpenShortcuts}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Wallpaper Boundary Marker Toggle */}
        <button
          title={`Wallpaper Boundary: ${showBoundaryMarker ? "Visible" : "Hidden"} (B)`}
          aria-label="Toggle wallpaper boundary marker"
          onClick={toggleBoundaryMarker}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer",
            showBoundaryMarker
              ? "text-sky-600 bg-sky-50 hover:bg-sky-100"
              : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100",
          )}
        >
          <SquareDashed className="w-3.5 h-3.5" />
        </button>

        {/* Preview Wallpaper — utility, visually secondary */}
        <button
          title="Preview Wallpaper (H)"
          onClick={togglePreview}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Done / Exit Drawing Mode — primary CTA */}
        <button
          title="Exit Drawing Mode"
          onClick={() => setMode("wallpaper")}
          className="ml-1.5 h-8 px-3 rounded-xl flex items-center gap-1.5 bg-neutral-900 text-white hover:bg-neutral-700 transition-all duration-150 shadow-sm active:scale-95 cursor-pointer text-xs font-semibold tracking-tight"
        >
          <Check className="w-3.5 h-3.5 shrink-0" />
          Done
        </button>
      </div>
    </div>
  );
};
