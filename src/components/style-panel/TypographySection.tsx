import React from "react";
import { FontFamily } from "../../elements/types";
import { cn } from "../../lib/utils";

interface TypographySectionProps {
  activeFontFamily: FontFamily;
  activeFontSize: number;
  onFontFamilyChange: (font: FontFamily) => void;
  onFontSizeChange: (size: number) => void;
}

const FONT_FAMILIES: { id: FontFamily; label: string }[] = [
  { id: "handwritten", label: "Hand-drawn" },
  { id: "sans", label: "Normal" },
  { id: "monospace", label: "Code" },
];

const FONT_SIZES = [
  { size: 16, label: "S" },
  { size: 20, label: "M" },
  { size: 28, label: "L" },
  { size: 36, label: "XL" },
];

export const TypographySection: React.FC<TypographySectionProps> = ({
  activeFontFamily,
  activeFontSize,
  onFontFamilyChange,
  onFontSizeChange,
}) => {
  return (
    <>
      {/* Font Family */}
      <div>
        <div className="text-xs font-hand font-bold text-muted mb-1.5">
          Font
        </div>
        <div className="grid grid-cols-3 gap-1">
          {FONT_FAMILIES.map((f) => {
            const isSelected = activeFontFamily === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFontFamilyChange(f.id)}
                className={cn(
                  "py-1 rounded-sk border-2 text-[11px] font-hand transition-all cursor-pointer",
                  isSelected
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm font-bold"
                    : "bg-paper text-ink border-transparent hover:border-line/30",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <div className="text-xs font-hand font-bold text-muted mb-1.5">
          Size
        </div>
        <div className="grid grid-cols-4 gap-1">
          {FONT_SIZES.map((s) => {
            const isSelected = activeFontSize === s.size;
            return (
              <button
                key={s.size}
                onClick={() => onFontSizeChange(s.size)}
                className={cn(
                  "py-1 rounded-sk border-2 text-[11px] font-hand transition-all cursor-pointer",
                  isSelected
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm font-bold"
                    : "bg-paper text-ink border-transparent hover:border-line/30",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
