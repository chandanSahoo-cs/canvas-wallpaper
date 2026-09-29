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
      className={cn(
        "fixed bottom-6 right-6 z-20 flex items-center p-1 rounded-full backdrop-blur-xl border transition-all duration-200 shadow-2xl",
        isLight
          ? "bg-neutral-900/90 text-white border-neutral-700/60 shadow-black/25"
          : "bg-black/45 text-white border-white/20 shadow-black/40",
      )}
    >
      <button
        title="Keyboard Shortcuts (?)"
        aria-label="Keyboard Shortcuts"
        onClick={onOpenShortcuts}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 text-white active:scale-95 transition-colors cursor-pointer"
      >
        <Keyboard className="w-4 h-4" />
      </button>
      <div
        className={cn(
          "w-px h-4 mx-0.5",
          isLight ? "bg-white/20" : "bg-white/30",
        )}
      />
      <button
        title="Settings & Privacy"
        aria-label="Settings and Privacy"
        onClick={onOpenSettings}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 text-white active:scale-95 transition-colors cursor-pointer"
      >
        <Settings className="w-4 h-4" />
      </button>
      <div
        className={cn(
          "w-px h-4 mx-0.5",
          isLight ? "bg-white/20" : "bg-white/30",
        )}
      />
      <button
        title="Widget Layout & Accessories (Drag anywhere on grid)"
        onClick={onOpenLayout}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 text-white active:scale-95 transition-colors"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <div
        className={cn(
          "w-px h-4 mx-0.5",
          isLight ? "bg-white/20" : "bg-white/30",
        )}
      />
      <button
        title="Customize Wallpaper (Press E or click)"
        onClick={onEnterDrawMode}
        className="h-9 px-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-white/15 text-white text-xs font-semibold active:scale-95 transition-colors leading-none"
      >
        <Pencil className="w-4 h-4" />
        <span className="leading-none">Draw</span>
      </button>
    </div>
  );
};
