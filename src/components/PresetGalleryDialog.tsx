import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Check,
  Plus,
  Palette,
  Columns3,
  Orbit,
  Mountain,
  Grid3X3,
} from "lucide-react";
import { WALLPAPER_PRESETS, WallpaperPreset } from "../lib/wallpaperPresets";
import { useSceneStore, MAX_SCENES } from "../store/useSceneStore";
import { cn } from "../lib/utils";

interface PresetGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterDrawMode?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-3.5 h-3.5" />,
  Creative: <Palette className="w-3.5 h-3.5" />,
  Productivity: <Columns3 className="w-3.5 h-3.5" />,
  Cosmic: <Orbit className="w-3.5 h-3.5" />,
  Nature: <Mountain className="w-3.5 h-3.5" />,
  Minimal: <Grid3X3 className="w-3.5 h-3.5" />,
};

export const PresetGalleryDialog: React.FC<PresetGalleryDialogProps> = ({
  isOpen,
  onClose,
  onEnterDrawMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  const scenes = useSceneStore((s) => s.scenes);
  const isAtLimit = scenes.length >= MAX_SCENES;
  const createScene = useSceneStore((s) => s.createScene);
  const applyPresetToActiveScene = useSceneStore(
    (s) => s.applyPresetToActiveScene,
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ["All", "Creative", "Productivity", "Cosmic", "Nature", "Minimal"];

  const filteredPresets =
    selectedCategory === "All"
      ? WALLPAPER_PRESETS
      : WALLPAPER_PRESETS.filter((p) => p.category === selectedCategory);

  const handleApply = (preset: WallpaperPreset) => {
    applyPresetToActiveScene(preset);
    setAppliedPresetId(preset.id);
    setTimeout(() => {
      setAppliedPresetId(null);
      onClose();
      onEnterDrawMode?.();
    }, 500);
  };

  const handleCreateScene = (preset: WallpaperPreset) => {
    if (isAtLimit) return;
    const w = typeof window !== "undefined" ? window.innerWidth : 1440;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    const elements = preset.getElements(w, h);
    createScene(preset.title, elements, preset.background);
    onClose();
    onEnterDrawMode?.();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface text-ink border-2 border-line shadow-hard rounded-sk-lg w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sk bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-hand text-lg font-bold text-ink leading-tight">
                Wallpaper Presets & Templates
              </h2>
              <p className="text-xs font-sans text-muted">
                Choose a hand-drawn artwork or productivity canvas for your new tab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sk border-2 border-transparent hover:border-line hover:bg-paper flex items-center justify-center text-ink/70 hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Categories */}
        <div className="px-6 py-2.5 border-b-2 border-line bg-paper flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sk text-xs font-hand font-bold transition-all cursor-pointer shrink-0 border-2",
                selectedCategory === cat
                  ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                  : "bg-surface text-ink/80 hover:text-ink hover:bg-paper border-transparent",
              )}
            >
              {CATEGORY_ICONS[cat]}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPresets.map((preset) => {
            const isJustApplied = appliedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                className="group relative rounded-sk border-2 border-line bg-surface shadow-hard-sm flex flex-col overflow-hidden transition-all"
              >
                {/* Visual Banner Preview */}
                <div
                  className="h-28 relative flex items-center justify-center p-4 border-b-2 border-line"
                  style={{ background: preset.previewBg }}
                >
                  <span
                    className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-sk-sm text-[10px] font-hand font-bold tracking-wider uppercase border-2 border-line shadow-hard-sm"
                    style={{
                      backgroundColor: preset.accentColor,
                      color: "#0E1A1F",
                    }}
                  >
                    {preset.badge}
                  </span>

                  <div className="flex items-center gap-2 bg-surface text-ink px-2.5 py-1 rounded-sk border-2 border-line shadow-hard-sm font-hand text-xs font-bold">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-line"
                      style={{ backgroundColor: preset.background.color }}
                    />
                    <span>
                      Pattern: {preset.background.pattern || "none"}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-hand font-bold text-base text-ink mb-1 group-hover:text-blue-text transition-colors">
                      {preset.title}
                    </h3>
                    <p className="text-xs font-sans text-muted leading-relaxed mb-4">
                      {preset.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-line/20">
                    <button
                      onClick={() => handleApply(preset)}
                      disabled={isJustApplied}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-sk text-xs font-hand font-bold transition-all cursor-pointer border-2 border-line shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px]",
                        isJustApplied
                          ? "bg-brand-green text-on-accent"
                          : "bg-brand-green text-on-accent hover:brightness-105",
                      )}
                    >
                      {isJustApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Applied!
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Apply
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCreateScene(preset)}
                      disabled={isAtLimit}
                      title={
                        isAtLimit
                          ? `Scene limit reached (${MAX_SCENES})`
                          : "Create as a brand new scene"
                      }
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-3 rounded-sk text-xs font-hand font-bold border-2 transition-all cursor-pointer",
                        isAtLimit
                          ? "opacity-30 cursor-not-allowed border-line/30 text-muted"
                          : "border-line bg-paper hover:bg-surface text-ink shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px]",
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Scene</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t-2 border-line bg-paper flex items-center justify-between text-xs text-muted font-sans">
          <span>Tip: Applying a preset creates an undo step (press Ctrl+Z anytime).</span>
          <span className="font-mono text-ink">
            {scenes.length}/{MAX_SCENES} Scenes
          </span>
        </div>
      </div>
    </div>
  );
};
