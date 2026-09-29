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
      <svg className="w-7 h-2" viewBox="0 0 28 8">
        <line
          x1="0"
          y1="4"
          x2="28"
          y2="4"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>
    ),
  },
  {
    id: "dashed",
    label: "Dashed",
    svg: (
      <svg className="w-7 h-2" viewBox="0 0 28 8">
        <line
          x1="0"
          y1="4"
          x2="28"
          y2="4"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="6 3"
        />
      </svg>
    ),
  },
  {
    id: "dotted",
    label: "Dotted",
    svg: (
      <svg className="w-7 h-2" viewBox="0 0 28 8">
        <line
          x1="1"
          y1="4"
          x2="27"
          y2="4"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="1 4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const ROUGHNESS_OPTIONS = [
  { val: 0.2, label: "Clean" },
  { val: 1.4, label: "Sketch" },
  { val: 2.5, label: "Rough" },
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
      {/* Fill Style with Visual SVG Icons */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Fill Style
        </div>
        <div className="grid grid-cols-3 gap-1">
          {FILL_STYLES.map((f) => (
            <button
              key={f.id}
              onClick={() => onFillStyleChange(f.id)}
              title={f.label}
              className={cn(
                "py-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer",
                activeFillStyle === f.id
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-600",
              )}
            >
              {f.icon}
              <span className="text-[10px] font-medium leading-none">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Style with Visual SVG Lines */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Stroke Style
        </div>
        <div className="grid grid-cols-3 gap-1">
          {STROKE_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => onStrokeStyleChange(s.id)}
              title={s.label}
              className={cn(
                "py-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer",
                activeStrokeStyle === s.id
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-600",
              )}
            >
              {s.svg}
              <span className="text-[10px] font-medium leading-none">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Roughness / Aesthetic */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Aesthetic
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ROUGHNESS_OPTIONS.map((r) => (
            <button
              key={r.val}
              onClick={() => onRoughnessChange(r.val)}
              className={cn(
                "py-1.5 rounded-lg border text-[11px] font-medium transition-all active:scale-95 cursor-pointer",
                Math.abs(activeRoughness - r.val) < 0.3
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-600",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Stroke Width
        </div>
        <div className="flex items-center gap-1">
          {STROKE_WIDTH_OPTIONS.map((s) => (
            <button
              key={s.size}
              onClick={() => onWidthChange(s.size)}
              title={s.label}
              className={cn(
                "flex-1 py-1.5 rounded-lg flex items-center justify-center border transition-all active:scale-95 cursor-pointer",
                activeStrokeWidth === s.size
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-600",
              )}
            >
              <span
                className="rounded-full bg-current block"
                style={{ width: `${s.dot}px`, height: `${s.dot}px` }}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
