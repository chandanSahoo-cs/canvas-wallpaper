import React, { useState, useMemo } from "react";
import { Check, Copy, Palette, Sparkles, X, Plus, Image as ImageIcon } from "lucide-react";
import { LibraryItem } from "../../lib/library/types";
import { mergePalettes } from "../../lib/assets/color";
import { useAppStore } from "../../store/useAppStore";
import { RectangleElement } from "../../elements/types";
import { cn } from "../../lib/utils";

interface PaletteExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: LibraryItem[];
  onClearSelection: () => void;
  onCloseLibrary: () => void;
}

export const PaletteExtractorModal: React.FC<PaletteExtractorModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onClearSelection,
  onCloseLibrary,
}) => {
  const [copiedType, setCopiedType] = useState<"hex" | "css" | null>(null);
  const [bgAppliedColor, setBgAppliedColor] = useState<string | null>(null);
  const [selectedSwatchHex, setSelectedSwatchHex] = useState<string | null>(null);

  // Extract all palettes from selected image items
  const mergedSwatches = useMemo(() => {
    const palettes = selectedItems
      .filter((it) => it.type === "image" && Array.isArray(it.palette) && it.palette.length > 0)
      .map((it) => it.palette);

    return mergePalettes(palettes, 6);
  }, [selectedItems]);

  if (!isOpen) return null;

  const hexList = mergedSwatches.map((s) => s.hex).join(", ");
  const cssVars = `:root {\n${mergedSwatches
    .map((s, idx) => `  --palette-${idx + 1}: ${s.hex};`)
    .join("\n")}\n}`;

  const dominantHex = mergedSwatches[0]?.hex || "#46BAEB";
  const activeTargetHex = selectedSwatchHex || dominantHex;

  // Action 1: Copy Hex List
  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(hexList);
      setCopiedType("hex");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {}
  };

  // Action 2: Copy CSS Variables
  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(cssVars);
      setCopiedType("css");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {}
  };

  // Action 3: Set as Board Background
  const handleSetBackground = () => {
    const appState = useAppStore.getState();
    appState.setBackground({ color: activeTargetHex });
    setBgAppliedColor(activeTargetHex);
    setTimeout(() => setBgAppliedColor(null), 2500);
  };

  // Action 4: Add Swatches to Canvas as small color cards (rectangle elements)
  const handleAddSwatchesToBoard = () => {
    const state = useAppStore.getState();
    const { zoom, scrollOffset } = state;
    const centerX = window.innerWidth / 2 / zoom + scrollOffset.x;
    const centerY = window.innerHeight / 2 / zoom + scrollOffset.y;

    const cardW = 90;
    const cardH = 90;
    const gap = 16;
    const count = mergedSwatches.length;
    const totalW = count * (cardW + gap) - gap;
    const startX = Math.round(centerX - totalW / 2);
    const startY = Math.round(centerY - cardH / 2);

    const newRects: RectangleElement[] = mergedSwatches.map((swatch, idx) => ({
      id: `rect-swatch-${Date.now()}-${idx}`,
      type: "rectangle",
      x: startX + idx * (cardW + gap),
      y: startY,
      width: cardW,
      height: cardH,
      strokeColor: "#0E1A1F",
      fillColor: swatch.hex,
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      locked: false,
      seed: Math.floor(Math.random() * 2 ** 31),
    }));

    state.pushHistory();
    state.setElements([...state.elements, ...newRects]);
    state.setSelectedIds(new Set(newRects.map((r) => r.id)));
    state.setTool("selection");
    if (state.mode === "wallpaper") {
      state.setMode("drawing");
    }

    onClose();
    onClearSelection();
    onCloseLibrary();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-100 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface text-ink border-2 border-line rounded-sk-lg p-5 shadow-hard flex flex-col gap-4 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-line">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand-blue" />
            <h3 className="font-hand font-bold text-base text-ink">
              Palette from Selection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sk text-muted hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-sans text-muted">
          Merged dominant color scheme extracted from {selectedItems.length} selected item(s) in OKLab color space.
        </p>

        {/* Swatches Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {mergedSwatches.map((swatch) => {
            const isSelected = activeTargetHex === swatch.hex;
            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setSelectedSwatchHex(swatch.hex)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-sk border-2 transition-all cursor-pointer bg-paper hover:bg-surface",
                  isSelected
                    ? "border-brand-blue shadow-hard-sm -translate-y-0.5"
                    : "border-line/30 hover:border-line",
                )}
              >
                <div
                  className="w-full h-12 rounded-sk-sm border border-line/40 shadow-inner mb-1.5"
                  style={{ backgroundColor: swatch.hex }}
                />
                <span className="font-mono text-[10px] font-bold text-ink">
                  {swatch.hex}
                </span>
                <span className="font-sans text-[9px] text-muted">
                  {Math.round(swatch.weight * 100)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Swatch Info */}
        <div className="p-3 bg-paper rounded-sk border border-line/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-sk-sm border-2 border-line shadow-xs"
              style={{ backgroundColor: activeTargetHex }}
            />
            <div>
              <div className="text-xs font-mono font-bold text-ink">
                {activeTargetHex}
              </div>
              <div className="text-[10px] font-sans text-muted">
                {activeTargetHex === dominantHex ? "Dominant color" : "Selected color"}
              </div>
            </div>
          </div>

          <button
            onClick={handleSetBackground}
            className={cn(
              "px-3 py-1.5 rounded-sk font-hand font-bold text-xs border-2 transition-all cursor-pointer flex items-center gap-1.5",
              bgAppliedColor
                ? "bg-brand-green text-on-accent border-line shadow-sm"
                : "bg-surface hover:bg-paper text-ink border-line/40 hover:border-line shadow-hard-sm",
            )}
          >
            {bgAppliedColor ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Applied Background!</span>
              </>
            ) : (
              <span>Set as Background</span>
            )}
          </button>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-line/20">
          {/* Action 1: Copy Hex */}
          <button
            onClick={handleCopyHex}
            className="px-3 py-2 rounded-sk bg-paper hover:bg-surface text-ink border-2 border-line/40 hover:border-line shadow-hard-sm font-hand font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedType === "hex" ? (
              <Check className="w-3.5 h-3.5 text-brand-green stroke-[3]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-brand-blue" />
            )}
            <span>{copiedType === "hex" ? "Copied Hex!" : "Copy Hex List"}</span>
          </button>

          {/* Action 2: Copy CSS Variables */}
          <button
            onClick={handleCopyCss}
            className="px-3 py-2 rounded-sk bg-paper hover:bg-surface text-ink border-2 border-line/40 hover:border-line shadow-hard-sm font-hand font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedType === "css" ? (
              <Check className="w-3.5 h-3.5 text-brand-green stroke-[3]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-brand-blue" />
            )}
            <span>{copiedType === "css" ? "Copied CSS!" : "Copy CSS Vars"}</span>
          </button>

          {/* Action 4: Add Swatches to Board */}
          <button
            onClick={handleAddSwatchesToBoard}
            className="px-3 py-2 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Cards to Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};
