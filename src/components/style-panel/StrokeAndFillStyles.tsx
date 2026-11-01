import React from "react";
import { FillStyle, StrokeStyle } from "../../elements/types";
import { cn } from "../../lib/utils";

interface StrokeAndFillStylesProps {
  activeFillStyle: FillStyle;
  activeStrokeStyle: StrokeStyle;
  activeRoughness: number;
  activeStrokeWidth: number;
  onFillStyleChange: (style: FillStyle) => void;
  onStrokeStyleChange: (style: StrokeStyle) => void;
  onRoughnessChange: (roughness: number) => void;
  onWidthChange: (width: number) => void;
}

const FILL_STYLES: { id: FillStyle; label: string; icon: React.ReactNode }[] = [
  {
    id: "solid",
    label: "Solid",
    icon: (
      <svg className="w-5 h-3" viewBox="0 0 20 12">
        <rect width="20" height="12" rx="2" fill="currentColor" opacity="0.8" />
      </svg>
    ),
  },
  {
    id: "hachure",
    label: "Hachure",
    icon: (
      <svg className="w-5 h-3" viewBox="0 0 20 12">
        <rect
          width="20"
          height="12"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="2"
          y1="12"
          x2="12"
          y2="0"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <line
          x1="7"
          y1="12"
          x2="17"
          y2="0"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <line
          x1="12"
          y1="12"
          x2="20"
          y2="2"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    id: "cross-hatch",
    label: "Cross",
    icon: (
      <svg className="w-5 h-3" viewBox="0 0 20 12">
        <rect
          width="20"
          height="12"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="2"
          y1="12"
          x2="12"
          y2="0"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <line
          x1="10"
          y1="12"
          x2="20"
          y2="0"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <line
          x1="2"
          y1="0"
          x2="12"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <line
          x1="10"
          y1="0"
          x2="20"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
];

const STROKE_STYLES: {
  id: StrokeStyle;
  label: string;
  svg: React.ReactNode;
}[] = [
  {
    id: "solid",
    label: "Solid",
    svg: (
      <svg className="w-6 h-1.5" viewBox="0 0 24 6">
        <line
          x1="0"
          y1="3"
          x2="24"
          y2="3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "dashed",
    label: "Dashed",
    svg: (
      <svg className="w-6 h-1.5" viewBox="0 0 24 6">
        <line
          x1="0"
          y1="3"
          x2="24"
          y2="3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "dotted",
    label: "Dotted",
    svg: (
      <svg className="w-6 h-1.5" viewBox="0 0 24 6">
        <line
          x1="1"
          y1="3"
          x2="23"
          y2="3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="1 3.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const ROUGHNESS_OPTIONS = [
  { val: 0.2, label: "Architect" },
  { val: 1.4, label: "Artist" },
  { val: 2.8, label: "Cartoon" },
];

const STROKE_WIDTH_OPTIONS = [
  { size: 1.5, label: "Thin", dot: 4 },
  { size: 3, label: "Medium", dot: 7 },
  { size: 5.5, label: "Thick", dot: 11 },
];

export const StrokeAndFillStyles: React.FC<StrokeAndFillStylesProps> = ({
  activeFillStyle,
  activeStrokeStyle,
  activeRoughness,
  activeStrokeWidth,
  onFillStyleChange,
  onStrokeStyleChange,
  onRoughnessChange,
  onWidthChange,
}) => {
  return (
    <>
      {/* Fill Style */}
      <div>
        <div className="text-xs font-hand font-bold text-muted mb-1.5">
          Fill style
        </div>
        <div className="grid grid-cols-3 gap-1">
          {FILL_STYLES.map((f) => {
            const isSelected = activeFillStyle === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFillStyleChange(f.id)}
                title={f.label}
                className={cn(
                  "py-1.5 rounded-sk border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer font-hand",
                  isSelected
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm font-bold"
                    : "bg-paper text-ink border-transparent hover:border-line/30",
                )}
              >
                {f.icon}
                <span className="text-[10px] leading-none">
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke Style */}
      <div>
        <div className="text-xs font-hand font-bold text-muted mb-1.5">
          Stroke style
        </div>
        <div className="grid grid-cols-3 gap-1">
          {STROKE_STYLES.map((s) => {
            const isSelected = activeStrokeStyle === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onStrokeStyleChange(s.id)}
                title={s.label}
                className={cn(
                  "py-1.5 rounded-sk border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer font-hand",
                  isSelected
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm font-bold"
                    : "bg-paper text-ink border-transparent hover:border-line/30",
                )}
              >
                {s.svg}
                <span className="text-[10px] leading-none">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roughness / Aesthetic */}
      <div>
        <div className="text-xs font-hand font-bold text-muted mb-1.5">
          Aesthetic
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ROUGHNESS_OPTIONS.map((r) => {
            const isSelected = Math.abs(activeRoughness - r.val) < 0.4;
            return (
              <button
                key={r.val}
                onClick={() => onRoughnessChange(r.val)}
                className={cn(
                  "py-1.5 rounded-sk border-2 text-[10px] font-hand transition-all cursor-pointer",
                  isSelected
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm font-bold"
                    : "bg-paper text-ink border-transparent hover:border-line/30",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <div className="text-xs font-hand font-bold text-muted mb-1.5">
          Stroke width
        </div>
        <div className="grid grid-cols-3 gap-1">
          {STROKE_WIDTH_OPTIONS.map((w) => {
            const isSelected = Math.abs(activeStrokeWidth - w.size) < 0.5;
            return (
              <button
                key={w.size}
                onClick={() => onWidthChange(w.size)}
                className={cn(
                  "py-1.5 rounded-sk border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-hand text-[10px]",
                  isSelected
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm font-bold"
                    : "bg-paper text-ink border-transparent hover:border-line/30",
                )}
              >
                <span
                  className="rounded-full bg-current shrink-0"
                  style={{ width: `${w.dot}px`, height: `${w.dot}px` }}
                />
                <span>{w.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
