import React from "react";
import { ZoomIn, ZoomOut, Crosshair } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const ZoomControls: React.FC = () => {
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const resetZoom = useAppStore((s) => s.resetZoom);
  const centerToOrigin = useAppStore((s) => s.centerToOrigin);

  return (
    <div className="flex items-center bg-neutral-100 rounded-xl px-1 py-0.5 text-xs text-neutral-600 font-mono">
      <button
        title="Zoom Out (Ctrl+-)"
        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        className="p-1 hover:text-neutral-900 hover:bg-white rounded-lg active:scale-90 transition-all cursor-pointer"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        title="Reset Zoom to 100% (Ctrl+0)"
        onClick={resetZoom}
        className="font-medium px-1.5 py-0.5 hover:text-neutral-900 hover:bg-white rounded-lg transition-all text-[11px] cursor-pointer"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        title="Zoom In (Ctrl++)"
        onClick={() => setZoom((z) => Math.min(5.0, z + 0.25))}
        className="p-1 hover:text-neutral-900 hover:bg-white rounded-lg active:scale-90 transition-all cursor-pointer"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-3.5 bg-neutral-200 mx-0.5 shrink-0" />
      <button
        title="Center canvas to (0,0) (Shift+0)"
        onClick={() => centerToOrigin(false)}
        className="p-1 hover:text-neutral-900 hover:bg-white rounded-lg active:scale-90 transition-all cursor-pointer"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
