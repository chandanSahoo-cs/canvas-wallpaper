import React from 'react';
import { cn } from '../../lib/utils';

interface ColorPickersProps {
  isLightBg: boolean;
  activeStrokeColor: string;
  activeFillColor: string;
  onStrokeChange: (color: string) => void;
  onFillChange: (color: string) => void;
}

const FILL_PRESETS = [
  'transparent',
  '#ffc9c9',
  '#b2f2bb',
  '#a5d8ff',
  '#ffec99',
  '#f3f0ff',
];

export const ColorPickers: React.FC<ColorPickersProps> = ({
  isLightBg,
  activeStrokeColor,
  activeFillColor,
  onStrokeChange,
  onFillChange,
}) => {
  const strokePresets = isLightBg
    ? ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#ffffff']
    : ['#ffffff', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#1e1e1e'];

  return (
    <>
      {/* Stroke Color */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Stroke
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {strokePresets.map((c) => (
            <button
              key={c}
              onClick={() => onStrokeChange(c)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform active:scale-90',
                activeStrokeColor === c
                  ? 'border-indigo-600 scale-110 shadow-sm'
                  : 'border-black/10 hover:scale-105'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="w-6 h-6 rounded-full overflow-hidden relative cursor-pointer border border-neutral-200 bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 active:scale-90 transition-transform">
            <input
              type="color"
              value={activeStrokeColor}
              onChange={(e) => onStrokeChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* Fill Color */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
          Fill
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILL_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onFillChange(c)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform active:scale-90',
                activeFillColor === c
                  ? 'border-indigo-600 scale-110 shadow-sm'
                  : 'border-black/10 hover:scale-105',
                c === 'transparent' &&
                  'bg-[radial-gradient(#e2e2e6_1px,transparent_1px)] [background-size:4px_4px] bg-white'
              )}
              style={c !== 'transparent' ? { backgroundColor: c } : {}}
            />
          ))}
          <label className="w-6 h-6 rounded-full overflow-hidden relative cursor-pointer border border-neutral-200 bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 active:scale-90 transition-transform">
            <input
              type="color"
              value={activeFillColor === 'transparent' ? '#ffffff' : activeFillColor}
              onChange={(e) => onFillChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>
    </>
  );
};
