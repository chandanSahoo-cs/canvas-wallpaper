import React, { useRef, useState } from "react";
import {
  RotateCcw,
  Check,
  LayoutGrid,
  GripHorizontal,
  SlidersHorizontal,
} from "lucide-react";
import { useWidgetStore } from "../store/useWidgetStore";
import { useAppStore } from "../store/useAppStore";
import { ClockWidget } from "./ClockWidget";
import { SearchBar } from "./SearchBar";
import { QuickLinks } from "./QuickLinks";
import { WidgetConfigDrawer } from "./WidgetConfigDrawer";
import { cn, isColorLight } from "../lib/utils";

interface WidgetLayoutOverlayProps {
  isLight?: boolean;
}

type WidgetKey = "clock" | "search" | "quickLinks";

export const WidgetLayoutOverlay: React.FC<WidgetLayoutOverlayProps> = ({
  isLight: propIsLight,
}) => {
  const isLayoutMode = useWidgetStore((s) => s.isLayoutMode);
  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);
  const widgetPositions = useWidgetStore((s) => s.widgetPositions);
  const setWidgetPosition = useWidgetStore((s) => s.setWidgetPosition);
  const resetWidgetPositions = useWidgetStore((s) => s.resetWidgetPositions);

  const showClock = useWidgetStore((s) => s.showClock);
  const showSearch = useWidgetStore((s) => s.showSearch);
  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);

  const background = useAppStore((s) => s.background);
  const isLight =
    propIsLight !== undefined
      ? propIsLight
      : !(background?.type === "image" && background?.imageAssetId) &&
        isColorLight(background?.color || "#14141a");

  const [activeDrag, setActiveDrag] = useState<WidgetKey | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });

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

    setWidgetPosition(key, { x: clampedX, y: clampedY }, false);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
      useWidgetStore.getState().saveToStorage();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden touch-none"
      onPointerUp={handlePointerUp}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (isConfigOpen) setIsConfigOpen(false);
          else setIsLayoutMode(false);
        }
      }}
    >
      {/* High-density visual grid background with brand blue snap guide color */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(70, 186, 235, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(70, 186, 235, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: "4% 4%",
        }}
      />

      {/* Screen Center Crosshairs in brand blue */}
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-brand-blue/60 pointer-events-none" />
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-brand-blue/60 pointer-events-none" />

      {/* Floating Header Controller Bar */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface text-ink px-4 py-2 rounded-sk-lg shadow-hard border-2 border-line text-xs animate-in fade-in duration-150">
        <div className="flex items-center gap-2 pr-3 border-r-2 border-line">
          <LayoutGrid className="w-4 h-4 text-brand-blue" />
          <span className="font-hand font-bold text-xs text-ink">Widget Layout</span>
          <span className="text-[10px] text-muted bg-paper border border-line/30 px-2 py-0.5 rounded-sk-sm font-mono">
            Drag Anywhere
          </span>
        </div>

        {/* Toggle Widgets & Add Quick Links Drawer Button */}
        <button
          onClick={() => setIsConfigOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-sk font-hand font-bold text-xs transition-all cursor-pointer border-2",
            isConfigOpen
              ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
              : "bg-paper text-ink border-line/30 hover:border-line",
          )}
          title="Toggle widgets on/off and add quick links"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Widgets & Links</span>
        </button>

        <button
          onClick={resetWidgetPositions}
          title="Reset to default center layout"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line font-hand font-bold text-xs transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => setIsLayoutMode(false)}
          title="Save layout and exit"
          className="flex items-center gap-1.5 px-3.5 py-1 bg-brand-green text-on-accent font-hand font-bold text-xs rounded-sk border-2 border-line shadow-hard hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>

      {/* POPUP DRAWER: ADD QUICK LINKS & TOGGLE WIDGETS */}
      <WidgetConfigDrawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      {/* DRAGGABLE WIDGET 1: CLOCK */}
      {showClock && (
        <div
          onPointerDown={(e) => handlePointerDown(e, "clock")}
          onPointerMove={(e) => handlePointerMove(e, "clock")}
          style={{
            left: `${widgetPositions.clock.x}%`,
            top: `${widgetPositions.clock.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          className={cn(
            "absolute cursor-grab active:cursor-grabbing p-4 rounded-sk-lg border-2 border-dashed transition-shadow flex flex-col items-center group",
            activeDrag === "clock"
              ? "border-brand-blue bg-surface/90 shadow-hard scale-102 z-40"
              : "border-brand-blue/50 bg-paper/60 hover:bg-paper/80 hover:border-brand-blue z-30 shadow-hard-sm",
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-sk bg-surface text-ink border-2 border-line text-[10px] font-hand font-bold tracking-wider uppercase shadow-hard-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3 text-brand-blue" />
            <span>Clock</span>
            <span className="font-mono text-muted">
              {Math.round(widgetPositions.clock.x)}%,{" "}
              {Math.round(widgetPositions.clock.y)}%
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
          onPointerDown={(e) => handlePointerDown(e, "search")}
          onPointerMove={(e) => handlePointerMove(e, "search")}
          style={{
            left: `${widgetPositions.search.x}%`,
            top: `${widgetPositions.search.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          className={cn(
            "absolute cursor-grab active:cursor-grabbing p-3 rounded-sk-lg border-2 border-dashed transition-shadow flex flex-col items-center group w-full max-w-md",
            activeDrag === "search"
              ? "border-brand-blue bg-surface/90 shadow-hard scale-102 z-40"
              : "border-brand-blue/50 bg-paper/60 hover:bg-paper/80 hover:border-brand-blue z-30 shadow-hard-sm",
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-sk bg-surface text-ink border-2 border-line text-[10px] font-hand font-bold tracking-wider uppercase shadow-hard-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3 text-brand-blue" />
            <span>Search Bar</span>
            <span className="font-mono text-muted">
              {Math.round(widgetPositions.search.x)}%,{" "}
              {Math.round(widgetPositions.search.y)}%
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
          onPointerDown={(e) => handlePointerDown(e, "quickLinks")}
          onPointerMove={(e) => handlePointerMove(e, "quickLinks")}
          style={{
            left: `${widgetPositions.quickLinks.x}%`,
            top: `${widgetPositions.quickLinks.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          className={cn(
            "absolute cursor-grab active:cursor-grabbing p-3 rounded-sk-lg border-2 border-dashed transition-shadow flex flex-col items-center group max-w-xl",
            activeDrag === "quickLinks"
              ? "border-brand-blue bg-surface/90 shadow-hard scale-102 z-40"
              : "border-brand-blue/50 bg-paper/60 hover:bg-paper/80 hover:border-brand-blue z-30 shadow-hard-sm",
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-sk bg-surface text-ink border-2 border-line text-[10px] font-hand font-bold tracking-wider uppercase shadow-hard-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3 text-brand-blue" />
            <span>Quick Links</span>
            <span className="font-mono text-muted">
              {Math.round(widgetPositions.quickLinks.x)}%,{" "}
              {Math.round(widgetPositions.quickLinks.y)}%
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
