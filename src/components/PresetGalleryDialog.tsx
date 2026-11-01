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
  ArrowRight,
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Wallpaper Presets & Templates
              </h2>
              <p className="text-xs text-neutral-400">
                Choose a hand-drawn artwork or productivity canvas for your new tab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Categories */}
        <div className="px-6 py-3 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0",
                selectedCategory === cat
                  ? "bg-white text-neutral-900 shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800",
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
                className="group relative rounded-2xl border border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800/80 hover:border-neutral-700 transition-all duration-200 flex flex-col overflow-hidden shadow-lg"
              >
                {/* Visual Banner Preview */}
                <div
                  className="h-28 relative flex items-center justify-center p-4 border-b border-neutral-800"
                  style={{ background: preset.previewBg }}
                >
                  <span
                    className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border backdrop-blur-md"
                    style={{
                      borderColor: `${preset.accentColor}60`,
                      backgroundColor: `${preset.accentColor}20`,
                      color: preset.accentColor,
                    }}
                  >
                    {preset.badge}
                  </span>

                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.background.color }}
                    />
                    <span className="text-[11px] font-medium text-neutral-300">
                      Pattern: {preset.background.pattern || "none"}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                      {preset.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                      {preset.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/60">
                    <button
                      onClick={() => handleApply(preset)}
                      disabled={isJustApplied}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95",
                        isJustApplied
                          ? "bg-emerald-500 text-white"
                          : "bg-white hover:bg-neutral-100 text-neutral-900",
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
                        "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                        isAtLimit
                          ? "opacity-40 cursor-not-allowed border-neutral-800 text-neutral-500"
                          : "border-neutral-700 hover:border-neutral-600 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 active:scale-95",
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
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-500">
          <span>Tip: Applying a preset pushes to history so you can press Ctrl+Z to undo anytime.</span>
          <span className="font-medium text-neutral-400">
            {scenes.length}/{MAX_SCENES} Scenes Used
          </span>
        </div>
      </div>
    </div>
  );
};
