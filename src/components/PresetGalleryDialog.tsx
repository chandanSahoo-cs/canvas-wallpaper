import React, { useState, useEffect } from "react";
import {
  X,
  LayoutTemplate,
  Check,
  Plus,
} from "lucide-react";
import { WALLPAPER_PRESETS, WallpaperPreset } from "../lib/wallpaperPresets";
import { useSceneStore, MAX_SCENES } from "../store/useSceneStore";
import { cn } from "../lib/utils";

interface PresetGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterDrawMode?: () => void;
}

export const PresetGalleryDialog: React.FC<PresetGalleryDialogProps> = ({
  isOpen,
  onClose,
  onEnterDrawMode,
}) => {
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
        className="bg-surface text-ink border-2 border-line shadow-hard rounded-sk-lg w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-line bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sk bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-hand text-lg font-bold text-ink leading-tight">
                Wallpaper Presets & Templates
              </h2>
              <p className="text-xs font-sans text-muted">
                Hand-drawn artwork and presets for your new tab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-sk border-2 border-transparent hover:border-line hover:bg-paper flex items-center justify-center text-ink/70 hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {WALLPAPER_PRESETS.map((preset) => {
            const isJustApplied = appliedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                className="rounded-sk border-2 border-line bg-surface shadow-hard flex flex-col overflow-hidden"
              >
                {/* Visual Banner Preview */}
                <div
                  className="h-32 relative flex items-center justify-center p-4 border-b-2 border-line"
                  style={{ background: preset.previewBg }}
                >
                  <span
                    className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-sk-sm text-[11px] font-hand font-bold tracking-wider uppercase border-2 border-line shadow-hard-sm"
                    style={{
                      backgroundColor: preset.accentColor,
                      color: "#0E1A1F",
                    }}
                  >
                    {preset.badge}
                  </span>

                  <div className="flex items-center gap-2 bg-surface text-ink px-3 py-1.5 rounded-sk border-2 border-line shadow-hard-sm font-hand text-xs font-bold">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-line"
                      style={{ backgroundColor: preset.background.color }}
                    />
                    <span>
                      Pattern: {preset.background.pattern || "none"}
                    </span>
                  </div>
                </div>

                {/* Card Content & Action Buttons */}
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <h3 className="font-hand font-bold text-lg text-ink mb-1">
                      {preset.title}
                    </h3>
                    <p className="text-xs font-sans text-muted leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t-2 border-line/20">
                    <button
                      onClick={() => handleApply(preset)}
                      disabled={isJustApplied}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-sk text-sm font-hand font-bold transition-all cursor-pointer border-2 border-line shadow-hard active:translate-x-[2px] active:translate-y-[2px]",
                        isJustApplied
                          ? "bg-brand-green text-on-accent"
                          : "bg-brand-green text-on-accent hover:brightness-105",
                      )}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isJustApplied ? "Applied!" : "Apply Wallpaper"}</span>
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
                        "flex items-center justify-center gap-2 py-2.5 px-4 rounded-sk text-sm font-hand font-bold border-2 transition-all cursor-pointer",
                        isAtLimit
                          ? "opacity-30 cursor-not-allowed border-line/30 text-muted"
                          : "border-line bg-paper hover:bg-surface text-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px]",
                      )}
                    >
                      <Plus className="w-4 h-4" />
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
          <span>Tip: Applying a preset updates your active scene (press Ctrl+Z anytime to undo).</span>
          <span className="font-mono text-ink">
            {scenes.length}/{MAX_SCENES} Scenes
          </span>
        </div>
      </div>
    </div>
  );
};
