import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ZoomControls: React.FC = () => {
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const resetZoom = useAppStore((s) => s.resetZoom);

  return (
    <div className="flex items-center bg-neutral-100/90 rounded-xl px-1 py-0.5 text-xs text-neutral-700 font-mono">
      <button
        title="Zoom Out"
        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        className="p-1 hover:text-neutral-900 hover:bg-white/80 rounded-lg active:scale-90 transition-all cursor-pointer"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        title="Reset Zoom to 100%"
        onClick={resetZoom}
        className="font-medium px-1.5 py-0.5 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all text-[11px] cursor-pointer"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        title="Zoom In"
        onClick={() => setZoom((z) => Math.min(5.0, z + 0.25))}
        className="p-1 hover:text-neutral-900 hover:bg-white/80 rounded-lg active:scale-90 transition-all cursor-pointer"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
