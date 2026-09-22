import React, { useState, useRef } from 'react';
import {
  GripHorizontal,
  Check,
  RotateCcw,
  AlignCenter,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { useWidgetStore, WidgetPosition, DEFAULT_WIDGET_POSITIONS } from '../store/useWidgetStore';
import { ClockWidget } from './ClockWidget';
import { SearchBar } from './SearchBar';
import { QuickLinks } from './QuickLinks';
import { cn } from '../lib/utils';

interface WidgetLayoutOverlayProps {
  isLight?: boolean;
}

type WidgetKey = 'clock' | 'search' | 'quickLinks';

export const WidgetLayoutOverlay: React.FC<WidgetLayoutOverlayProps> = ({ isLight }) => {
  const isLayoutMode = useWidgetStore((s) => s.isLayoutMode);
  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);
  const widgetPositions = useWidgetStore((s) => s.widgetPositions);
  const setWidgetPosition = useWidgetStore((s) => s.setWidgetPosition);
  const setAllWidgetPositions = useWidgetStore((s) => s.setAllWidgetPositions);
  const resetWidgetPositions = useWidgetStore((s) => s.resetWidgetPositions);

  const showClock = useWidgetStore((s) => s.showClock);
  const showSearch = useWidgetStore((s) => s.showSearch);
  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);

  const [activeDrag, setActiveDrag] = useState<WidgetKey | null>(null);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  if (!isLayoutMode) return null;

  const handlePointerDown = (e: React.PointerEvent, key: WidgetKey) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDrag(key);

    const currentPos = widgetPositions[key];
    const currentPixelX = (currentPos.x / 100) * window.innerWidth;
    const currentPixelY = (currentPos.y / 100) * window.innerHeight;

    dragOffsetRef.current = {
      offsetX: e.clientX - currentPixelX,
      offsetY: e.clientY - currentPixelY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent, key: WidgetKey) => {
    if (activeDrag !== key) return;

    const rawPixelX = e.clientX - dragOffsetRef.current.offsetX;
    const rawPixelY = e.clientY - dragOffsetRef.current.offsetY;

    let targetX = (rawPixelX / window.innerWidth) * 100;
    let targetY = (rawPixelY / window.innerHeight) * 100;

    // Magnetic snap to center (50%) if within 2.5%
    if (Math.abs(targetX - 50) < 2.5) targetX = 50;
    if (Math.abs(targetY - 50) < 2.5) targetY = 50;

    // Magnetic snap to quarter axes (25% and 75%)
    if (Math.abs(targetX - 25) < 2.0) targetX = 25;
    if (Math.abs(targetX - 75) < 2.0) targetX = 75;

    // Clamp coordinates safely within viewport
    const clampedX = Math.min(92, Math.max(8, targetX));
    const clampedY = Math.min(92, Math.max(8, targetY));

    setWidgetPosition(key, { x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
    }
  };

  const handleSnapCenter = () => {
    setAllWidgetPositions({
      clock: { x: 50, y: widgetPositions.clock.y },
      search: { x: 50, y: widgetPositions.search.y },
      quickLinks: { x: 50, y: widgetPositions.quickLinks.y },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden touch-none"
      onPointerUp={handlePointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setIsLayoutMode(false);
      }}
    >
      {/* High-density visual grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '4% 4%',
        }}
      />

      {/* Screen Center Crosshairs */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-indigo-500/30 pointer-events-none" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-indigo-500/30 pointer-events-none" />

      {/* Floating Header Controller Bar */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-neutral-900/90 hover:bg-neutral-900 text-white backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl border border-white/20 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-white/20">
          <LayoutGrid className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold">Widget Layout Mode</span>
          <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full font-mono">
            Drag Anywhere
          </span>
        </div>

        <button
          onClick={handleSnapCenter}
          title="Snap all widgets to horizontal center"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium active:scale-95 transition-all"
        >
          <AlignCenter className="w-3.5 h-3.5" />
          <span>Center X</span>
        </button>

        <button
          onClick={resetWidgetPositions}
          title="Reset to default center layout"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => setIsLayoutMode(false)}
          title="Save layout and exit"
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>

      {/* DRAGGABLE WIDGET 1: CLOCK */}
      {showClock && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'clock')}
          onPointerMove={(e) => handlePointerMove(e, 'clock')}
          style={{
            left: `${widgetPositions.clock.x}%`,
            top: `${widgetPositions.clock.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'absolute cursor-grab active:cursor-grabbing p-4 rounded-3xl border-2 border-dashed transition-shadow flex flex-col items-center group',
            activeDrag === 'clock'
              ? 'border-indigo-500 bg-indigo-500/20 shadow-2xl scale-102 z-40'
              : 'border-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/15 hover:border-indigo-500 z-30'
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tracking-wider uppercase shadow-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3" />
            <span>Clock</span>
            <span className="font-mono opacity-80">
              {Math.round(widgetPositions.clock.x)}%, {Math.round(widgetPositions.clock.y)}%
            </span>
          </div>

          <div className="pointer-events-none">
            <ClockWidget isLight={isLight} />
          </div>
        </div>
      )}

      {/* DRAGGABLE WIDGET 2: SEARCH BAR */}
      {showSearch && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'search')}
          onPointerMove={(e) => handlePointerMove(e, 'search')}
          style={{
            left: `${widgetPositions.search.x}%`,
            top: `${widgetPositions.search.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'absolute cursor-grab active:cursor-grabbing p-3 rounded-3xl border-2 border-dashed transition-shadow flex flex-col items-center group w-full max-w-md',
            activeDrag === 'search'
              ? 'border-indigo-500 bg-indigo-500/20 shadow-2xl scale-102 z-40'
              : 'border-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/15 hover:border-indigo-500 z-30'
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tracking-wider uppercase shadow-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3" />
            <span>Search Bar</span>
            <span className="font-mono opacity-80">
              {Math.round(widgetPositions.search.x)}%, {Math.round(widgetPositions.search.y)}%
            </span>
          </div>

          <div className="w-full pointer-events-none">
            <SearchBar isLight={isLight} />
          </div>
        </div>
      )}

      {/* DRAGGABLE WIDGET 3: QUICK LINKS */}
      {showQuickLinks && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'quickLinks')}
          onPointerMove={(e) => handlePointerMove(e, 'quickLinks')}
          style={{
            left: `${widgetPositions.quickLinks.x}%`,
            top: `${widgetPositions.quickLinks.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'absolute cursor-grab active:cursor-grabbing p-3 rounded-3xl border-2 border-dashed transition-shadow flex flex-col items-center group max-w-xl',
            activeDrag === 'quickLinks'
              ? 'border-indigo-500 bg-indigo-500/20 shadow-2xl scale-102 z-40'
              : 'border-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/15 hover:border-indigo-500 z-30'
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tracking-wider uppercase shadow-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3" />
            <span>Quick Links</span>
            <span className="font-mono opacity-80">
              {Math.round(widgetPositions.quickLinks.x)}%, {Math.round(widgetPositions.quickLinks.y)}%
            </span>
          </div>

          <div className="pointer-events-none">
            <QuickLinks isLight={isLight} />
          </div>
        </div>
      )}
    </div>
  );
};
