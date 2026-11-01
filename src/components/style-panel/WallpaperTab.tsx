import React, { useRef } from "react";
import {
  Image as ImageIcon,
  RotateCcw,
  Crosshair,
  SquareDashed,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { optimizeImageDataUrl } from "../../lib/imageInsert";
import { useAppStore } from "../../store/useAppStore";
import { useSceneStore } from "../../store/useSceneStore";
import { WALLPAPER_PRESETS } from "../../lib/wallpaperPresets";

const BG_PRESETS = [
  "#14141a",
  "#1e1e24",
  "#f5f5f7",
  "#0b3d91",
  "#2d6a4f",
  "#2b1b3d",
];

const PATTERN_OPTIONS = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "lines", label: "Lines" },
] as const;

export const WallpaperTab: React.FC = () => {
  const background = useAppStore((s) => s.background);
  const setBackground = useAppStore((s) => s.setBackground);
  const clearCanvas = useAppStore((s) => s.clearCanvas);
  const centerToOrigin = useAppStore((s) => s.centerToOrigin);
  const centerArtworkToScreen = useAppStore((s) => s.centerArtworkToScreen);
  const showBoundaryMarker = useAppStore((s) => s.showBoundaryMarker);
  const toggleBoundaryMarker = useAppStore((s) => s.toggleBoundaryMarker);
  const setIsPresetsOpen = useAppStore((s) => s.setIsPresetsOpen);
  const applyPresetToActiveScene = useSceneStore(
    (s) => s.applyPresetToActiveScene,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const optimized = optimizeImageDataUrl(img, 1920);
        setBackground({
          type: "image",
          imageUrl: optimized,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Preset Wallpapers & Templates */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-hand font-bold text-muted">
            Presets & Templates
          </div>
          <button
            onClick={() => setIsPresetsOpen(true)}
            className="flex items-center gap-1 text-[11px] font-hand font-bold text-blue-text hover:underline cursor-pointer"
          >
            <LayoutTemplate className="w-3 h-3 text-brand-blue" />
            <span>Browse Gallery</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {WALLPAPER_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPresetToActiveScene(p)}
              className="group flex flex-col p-2.5 rounded-sk border-2 border-line bg-paper hover:bg-surface shadow-hard-sm transition-all text-left cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            >
              <div
                className="w-full h-9 rounded-sk-sm mb-2 flex items-center justify-between px-2.5 text-[10px] font-hand font-bold border border-line/20 shadow-inner"
                style={{ background: p.previewBg }}
              >
                <span className="text-white opacity-95">{p.badge}</span>
                <span className="text-[10px] font-hand font-bold bg-brand-green text-on-accent px-1.5 py-0.5 rounded-sk-sm border border-line">
                  Apply
                </span>
              </div>
              <span className="text-xs font-hand font-bold text-ink truncate">
                {p.title}
              </span>
              <span className="text-[10px] font-sans text-muted line-clamp-1">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="pt-2 border-t border-line/20">
        <div className="text-xs font-hand font-bold text-muted mb-2">
          Background
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {BG_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setBackground({ type: "color", color: c })}
              className={cn(
                "w-6 h-6 rounded-sk-sm border-2 transition-transform cursor-pointer active:scale-90",
                (background.color || "#14141a").toLowerCase() ===
                  c.toLowerCase()
                  ? "border-line shadow-hard-sm scale-110 z-10"
                  : "border-line/30 hover:border-line/70 hover:scale-105",
              )}
              style={{ backgroundColor: c }}
            />
          ))}

          {/* Custom color picker */}
          <label
            title="Custom Background Color"
            className="w-6 h-6 rounded-sk-sm overflow-hidden relative cursor-pointer border-2 border-line/40 hover:border-line bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 active:scale-90 transition-transform"
          >
            <input
              type="color"
              value={background.color || "#14141a"}
              onChange={(e) =>
                setBackground({ type: "color", color: e.target.value })
              }
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Upload Background Image */}
          <button
            title="Set wallpaper image"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-6 h-6 rounded-sk-sm border-2 border-line/40 hover:border-line bg-paper hover:bg-surface flex items-center justify-center text-ink transition-transform cursor-pointer active:scale-90",
              background.type === "image" &&
                "border-line bg-brand-blue text-on-accent",
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Pattern Overlays */}
      <div>
        <div className="text-xs font-hand font-bold text-muted mb-2">
          Pattern
        </div>
        <div className="grid grid-cols-4 gap-1">
          {PATTERN_OPTIONS.map((p) => {
            const isSelected = (background.pattern ?? "none") === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setBackground({ pattern: p.id })}
                className={cn(
                  "py-1.5 rounded-sk border-2 text-[11px] font-hand font-bold transition-all text-center cursor-pointer",
                  isSelected
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "bg-paper text-ink border-transparent hover:border-line/30",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-2 border-t border-line/20 flex flex-col gap-1.5">
        <button
          onClick={toggleBoundaryMarker}
          className={cn(
            "w-full py-2 px-3 rounded-sk border-2 transition-all flex items-center justify-between text-xs font-hand font-bold cursor-pointer active:translate-x-[1px] active:translate-y-[1px]",
            showBoundaryMarker
              ? "border-line bg-brand-blue/20 text-ink shadow-hard-sm"
              : "border-line/30 hover:border-line bg-paper text-ink",
          )}
        >
          <span className="flex items-center gap-1.5">
            <SquareDashed className="w-3.5 h-3.5 text-brand-blue" />
            <span>Wallpaper Boundary</span>
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sk-sm bg-surface border border-line/30">
            {showBoundaryMarker ? "On" : "Off"}
          </span>
        </button>
        <button
          onClick={() => centerArtworkToScreen()}
          className="w-full py-2 px-3 rounded-sk border-2 border-line/30 hover:border-line bg-paper hover:bg-surface text-ink transition-all flex items-center justify-center gap-1.5 text-xs font-hand font-bold cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Crosshair className="w-3.5 h-3.5 text-muted" /> Center artwork on screen
        </button>
        <button
          onClick={() => centerToOrigin(true)}
          className="w-full py-2 px-3 rounded-sk border-2 border-line/30 hover:border-line bg-paper hover:bg-surface text-ink transition-all flex items-center justify-center gap-1.5 text-xs font-hand font-bold cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Crosshair className="w-3.5 h-3.5 text-muted" /> Center canvas to (0,0)
        </button>
        <button
          onClick={() => {
            if (confirm("Clear the whole wallpaper?")) clearCanvas();
          }}
          className="w-full py-2 px-3 rounded-sk border-2 border-line/30 hover:border-danger hover:bg-danger/10 hover:text-danger text-muted transition-all flex items-center justify-center gap-1.5 text-xs font-hand font-bold cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear wallpaper
        </button>
      </div>
    </div>
  );
};
