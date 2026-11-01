import React from "react";
import {
  Keyboard,
  Settings,
  LayoutGrid,
  Pencil,
  LayoutTemplate,
  Shuffle,
  Pin,
  EyeOff,
} from "lucide-react";
import { useResurfaceStore } from "../lib/resurface/store";
import { cn } from "../lib/utils";

interface WallpaperDockProps {
  isLight: boolean;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onOpenLayout: () => void;
  onOpenPresets: () => void;
  onEnterDrawMode: () => void;
}

export const WallpaperDock: React.FC<WallpaperDockProps> = ({
  isLight,
  onOpenShortcuts,
  onOpenSettings,
  onOpenLayout,
  onOpenPresets,
  onEnterDrawMode,
}) => {
  const resurfaceConfig = useResurfaceStore((s) => s.config);
  const showAnother = useResurfaceStore((s) => s.showAnother);
  const pinThis = useResurfaceStore((s) => s.pinThis);
  const neverShowAgain = useResurfaceStore((s) => s.neverShowAgain);
  const feedbackMessage = useResurfaceStore((s) => s.feedbackMessage);

  const isResurfacing = resurfaceConfig.mode !== "current";

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
      {/* Resurface Action Feedback Toast */}
      {feedbackMessage && (
        <div className="px-3 py-1.5 rounded-sk bg-surface border-2 border-line text-xs font-hand font-bold text-ink shadow-hard animate-in fade-in duration-150 whitespace-nowrap">
          {feedbackMessage}
        </div>
      )}

      <div
        id="tour-wallpaper-dock"
        className={cn(
          "flex items-center rounded-sk-lg backdrop-blur-md border-2 border-line shadow-hard transition-all duration-150 p-1 select-none",
          isLight ? "bg-surface/95 text-ink" : "bg-surface/95 text-ink",
        )}
      >
        {/* Resurface Controls when active */}
        {isResurfacing && (
          <>
            <div className="flex items-center gap-0.5">
              <button
                title="Show another pick (Shuffle)"
                aria-label="Show another item"
                onClick={showAnother}
                className="w-8 h-8 rounded-sk flex items-center justify-center hover:bg-paper text-ink/75 hover:text-ink active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-brand-blue" />
              </button>
              <button
                title="Pin this as active board or background wallpaper"
                aria-label="Pin this"
                onClick={pinThis}
                className="w-8 h-8 rounded-sk flex items-center justify-center hover:bg-paper text-ink/75 hover:text-ink active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Pin className="w-4 h-4 text-brand-green" />
              </button>
              <button
                title="Never show this again (Add to exclusion list)"
                aria-label="Never show again"
                onClick={neverShowAgain}
                className="w-8 h-8 rounded-sk flex items-center justify-center hover:bg-paper text-ink/75 hover:text-ink active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <EyeOff className="w-4 h-4 text-muted hover:text-danger" />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-line/20 shrink-0 mx-1.5" />
          </>
        )}

        {/* Utility icons */}
        <div className="flex items-center gap-0.5">
          <button
            title="Wallpaper Presets & Templates"
            aria-label="Wallpaper Presets and Templates"
            onClick={onOpenPresets}
            className="w-8 h-8 rounded-sk flex items-center justify-center hover:bg-paper text-ink/75 hover:text-ink active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <LayoutTemplate className="w-4 h-4 text-brand-blue" />
          </button>
          <button
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
            onClick={onOpenShortcuts}
            className="w-8 h-8 rounded-sk flex items-center justify-center hover:bg-paper text-ink/75 hover:text-ink active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            title="Settings & Privacy"
            aria-label="Settings and Privacy"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-sk flex items-center justify-center hover:bg-paper text-ink/75 hover:text-ink active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            title="Widget Layout & Accessories (Drag anywhere on grid)"
            onClick={onOpenLayout}
            className="w-8 h-8 rounded-sk flex items-center justify-center hover:bg-paper text-ink/75 hover:text-ink active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-line/20 shrink-0 mx-1.5" />

        {/* Draw CTA — solid, high contrast green confirmation CTA */}
        <div>
          <button
            title="Customize Wallpaper (Press E or click)"
            onClick={onEnterDrawMode}
            className="h-8 px-3.5 rounded-sk flex items-center gap-1.5 bg-brand-green text-on-accent border-2 border-line font-hand font-bold text-xs shadow-hard-sm hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-none">Draw</span>
          </button>
        </div>
      </div>
    </div>
  );
};
