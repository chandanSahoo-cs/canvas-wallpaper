import React from 'react';
import { FontFamily } from '../../elements/types';
import { cn } from '../../lib/utils';

interface TypographySectionProps {
  activeFontFamily: FontFamily;
  activeFontSize: number;
  onFontFamilyChange: (font: FontFamily) => void;
  onFontSizeChange: (size: number) => void;
}

const FONT_FAMILIES: { id: FontFamily; label: string }[] = [
  { id: 'handwritten', label: 'Hand-drawn' },
  { id: 'sans', label: 'Normal' },
  { id: 'monospace', label: 'Code' },
];

const FONT_SIZES = [
  { size: 16, label: 'S' },
  { size: 20, label: 'M' },
  { size: 28, label: 'L' },
  { size: 36, label: 'XL' },
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
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Font Family
        </div>
        <div className="grid grid-cols-3 gap-1">
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.id}
              onClick={() => onFontFamilyChange(f.id)}
              className={cn(
                'py-1 rounded-lg border text-[11px] font-medium transition-all active:scale-95 cursor-pointer',
                activeFontFamily === f.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Font Size
        </div>
        <div className="grid grid-cols-4 gap-1">
          {FONT_SIZES.map((s) => (
            <button
              key={s.size}
              onClick={() => onFontSizeChange(s.size)}
              className={cn(
                'py-1 rounded-lg border text-[11px] font-medium transition-all active:scale-95 cursor-pointer',
                activeFontSize === s.size
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
