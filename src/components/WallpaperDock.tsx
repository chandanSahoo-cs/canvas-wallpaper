import React from "react";
import { Keyboard, Settings, LayoutGrid, Pencil } from "lucide-react";
import { cn } from "../lib/utils";

interface WallpaperDockProps {
  isLight: boolean;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onOpenLayout: () => void;
  onEnterDrawMode: () => void;
}

export const WallpaperDock: React.FC<WallpaperDockProps> = ({
  isLight,
  onOpenShortcuts,
  onOpenSettings,
  onOpenLayout,
  onEnterDrawMode,
}) => {
  return (
    <div
      id="tour-wallpaper-dock"
      className={cn(
        "fixed bottom-6 right-6 z-20 flex items-center rounded-full backdrop-blur-xl border transition-all duration-200 shadow-2xl",
        isLight
          ? "bg-neutral-900/90 text-white border-neutral-700/60 shadow-black/25"
          : "bg-black/50 text-white border-white/15 shadow-black/40",
      )}
    >
      {/* Utility icons */}
      <div className="flex items-center p-1">
        <button
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
          onClick={onOpenShortcuts}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>
        <button
          title="Settings & Privacy"
          aria-label="Settings and Privacy"
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          title="Widget Layout & Accessories (Drag anywhere on grid)"
          onClick={onOpenLayout}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/15 shrink-0" />

      {/* Draw CTA — solid, high contrast */}
      <div className="p-1 pl-1.5">
        <button
          title="Customize Wallpaper (Press E or click)"
          onClick={onEnterDrawMode}
          className="h-8 px-4 rounded-full flex items-center gap-2 bg-white text-neutral-900 hover:bg-neutral-100 font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="leading-none">Draw</span>
        </button>
      </div>
    </div>
  );
};
