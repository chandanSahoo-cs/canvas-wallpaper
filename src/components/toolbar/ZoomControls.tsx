import React from "react";
import { ZoomIn, ZoomOut, Crosshair } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const ZoomControls: React.FC = () => {
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const resetZoom = useAppStore((s) => s.resetZoom);
  const centerToOrigin = useAppStore((s) => s.centerToOrigin);

  return (
    <div className="flex items-center bg-paper text-ink border border-line/40 rounded-sk px-1 py-0.5 text-xs font-mono">
      <button
        title="Zoom Out (Ctrl+-)"
        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        className="p-1 hover:text-ink hover:bg-surface rounded-sk-sm active:scale-95 transition-all cursor-pointer text-ink/80"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        title="Reset Zoom to 100% (Ctrl+0)"
        onClick={resetZoom}
        className="font-medium px-1.5 py-0.5 hover:text-ink hover:bg-surface rounded-sk-sm transition-all text-[11px] cursor-pointer"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        title="Zoom In (Ctrl++)"
        onClick={() => setZoom((z) => Math.min(5.0, z + 0.25))}
        className="p-1 hover:text-ink hover:bg-surface rounded-sk-sm active:scale-95 transition-all cursor-pointer text-ink/80"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-3.5 bg-line/20 mx-0.5 shrink-0" />
      <button
        title="Center canvas to (0,0) (Shift+0)"
        onClick={() => centerToOrigin(false)}
        className="p-1 hover:text-ink hover:bg-surface rounded-sk-sm active:scale-95 transition-all cursor-pointer text-ink/80"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
