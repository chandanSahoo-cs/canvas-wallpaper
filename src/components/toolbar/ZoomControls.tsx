import React from "react";
import { ZoomIn, ZoomOut, Monitor, Infinity as InfinityIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const ZoomControls: React.FC = () => {
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const resetZoom = useAppStore((s) => s.resetZoom);
  const canvasMode = useAppStore((s) => s.canvasMode);
  const toggleCanvasMode = useAppStore((s) => s.toggleCanvasMode);

  const minZoom = canvasMode === "viewport" ? 1.0 : 0.5;

  return (
    <div className="flex items-center bg-neutral-100/90 rounded-xl px-1 py-0.5 text-xs text-neutral-700 font-mono shadow-sm border border-neutral-200/50 backdrop-blur-md">
      <button
        title={
          canvasMode === "viewport"
            ? "Mode: Viewport-Bound (16:9 Auto-Fit). Click to switch to Infinite Canvas"
            : "Mode: Infinite Canvas. Click to switch to Viewport-Bound"
        }
        onClick={toggleCanvasMode}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] font-sans font-medium transition-all cursor-pointer ${
          canvasMode === "viewport"
            ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            : "text-neutral-600 hover:bg-white/80 hover:text-neutral-900"
        }`}
      >
        {canvasMode === "viewport" ? (
          <>
            <Monitor className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Viewport</span>
          </>
        ) : (
          <>
            <InfinityIcon className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Infinite</span>
          </>
        )}
      </button>

      <div className="w-[1px] h-3 bg-neutral-300 mx-1" />

      <button
        title="Zoom Out"
        disabled={canvasMode === "viewport" && zoom <= 1.0}
        onClick={() => setZoom((z) => Math.max(minZoom, z - 0.25))}
        className="p-1 hover:text-neutral-900 hover:bg-white/80 rounded-lg active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        title={canvasMode === "viewport" ? "Reset to Fit (100%)" : "Reset Zoom to 100%"}
        onClick={resetZoom}
        className="font-medium px-1.5 py-0.5 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all text-[11px] cursor-pointer"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        title="Zoom In"
        disabled={zoom >= 5.0}
        onClick={() => setZoom((z) => Math.min(5.0, z + 0.25))}
        className="p-1 hover:text-neutral-900 hover:bg-white/80 rounded-lg active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
