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
    <div
      id="tour-toolbar"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-surface border-2 border-line shadow-hard rounded-sk-lg p-1.5 flex items-center gap-1 select-none"
    >
      {/* Cluster 1: Primary Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((t) => {
          const isSelected = currentTool === t.id;
          return (
            <button
              key={t.id}
              title={`${t.label} (${t.shortcut})`}
              onClick={() => setTool(t.id)}
              className={cn(
                "w-8 h-8 rounded-sk flex items-center justify-center transition-all duration-150 cursor-pointer",
                isSelected
                  ? "bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm active-tilt z-10"
                  : "text-ink hover:bg-paper hover:border-line/40 border-2 border-transparent active:translate-x-[1px] active:translate-y-[1px]",
              )}
            >
              {t.icon}
            </button>
          );
        })}

        {/* Insert Image Button */}
        <button
          title="Insert Image (or paste with Ctrl+V)"
          onClick={() => imageInputRef.current?.click()}
          className="w-8 h-8 rounded-sk flex items-center justify-center text-ink hover:bg-paper hover:border-line/40 border-2 border-transparent active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150 cursor-pointer"
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

      <div className="w-px h-5 bg-line/20 mx-1 shrink-0" />

      {/* Cluster 2: History (Undo/Redo) & Zoom */}
      <div className="flex items-center gap-0.5">
        <button
          title="Undo (Ctrl+Z)"
          disabled={history.length === 0}
          onClick={undo}
          className={cn(
            "w-8 h-8 rounded-sk flex items-center justify-center transition-all duration-150 border-2 border-transparent",
            history.length === 0
              ? "opacity-30 cursor-not-allowed text-muted"
              : "text-ink hover:bg-paper hover:border-line/30 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer",
          )}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          title="Redo (Ctrl+Shift+Z)"
          disabled={future.length === 0}
          onClick={redo}
          className={cn(
            "w-8 h-8 rounded-sk flex items-center justify-center transition-all duration-150 border-2 border-transparent",
            future.length === 0
              ? "opacity-30 cursor-not-allowed text-muted"
              : "text-ink hover:bg-paper hover:border-line/30 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer",
          )}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <ZoomControls />
      </div>

      <div className="w-px h-5 bg-line/20 mx-1 shrink-0" />

      {/* Cluster 3: Utilities + Done */}
      <div className="flex items-center gap-0.5">
        <ExportMenu />

        {/* Keyboard Shortcuts */}
        {onOpenShortcuts && (
          <button
            title="Keyboard Shortcuts (?)"
            onClick={onOpenShortcuts}
            className="w-8 h-8 rounded-sk flex items-center justify-center text-ink/70 hover:text-ink hover:bg-paper hover:border-line/30 border-2 border-transparent transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
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
            "w-8 h-8 rounded-sk flex items-center justify-center transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer border-2",
            showBoundaryMarker
              ? "text-blue-text bg-brand-blue/20 border-line"
              : "text-ink/70 hover:text-ink hover:bg-paper border-transparent",
          )}
        >
          <SquareDashed className="w-3.5 h-3.5" />
        </button>

        {/* Preview Wallpaper */}
        <button
          title="Preview Wallpaper (H)"
          onClick={togglePreview}
          className="w-8 h-8 rounded-sk flex items-center justify-center text-ink/70 hover:text-ink hover:bg-paper hover:border-line/30 border-2 border-transparent transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Done / Exit Drawing Mode — primary confirmation CTA */}
        <button
          title="Exit Drawing Mode"
          onClick={() => setMode("wallpaper")}
          className="ml-1.5 h-8 px-3 rounded-sk flex items-center gap-1.5 bg-brand-green text-on-accent border-2 border-line shadow-hard hover:brightness-105 transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed cursor-pointer text-xs font-hand font-bold tracking-wide"
        >
          <Check className="w-3.5 h-3.5 shrink-0" />
          Done
        </button>
      </div>
    </div>
  );
};
