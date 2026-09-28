import React, { useRef } from 'react';
import { Image as ImageIcon, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

const BG_PRESETS = [
  '#14141a',
  '#1e1e24',
  '#f5f5f7',
  '#0b3d91',
  '#2d6a4f',
  '#2b1b3d',
];

const PATTERN_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'lines', label: 'Lines' },
] as const;

export const WallpaperTab: React.FC = () => {
  const background = useAppStore((s) => s.background);
  const setBackground = useAppStore((s) => s.setBackground);
  const clearCanvas = useAppStore((s) => s.clearCanvas);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBackground({
        type: 'image',
        imageUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Background Color */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Background Color
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {BG_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setBackground({ type: 'color', color: c })}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform active:scale-90',
                (background.color || '#14141a').toLowerCase() === c.toLowerCase()
                  ? 'border-indigo-600 scale-110 shadow-sm'
                  : 'border-black/10 hover:scale-105'
              )}
              style={{ backgroundColor: c }}
            />
          ))}

          {/* Custom color picker */}
          <label
            title="Custom Background Color"
            className="w-6 h-6 rounded-full overflow-hidden relative cursor-pointer border border-neutral-200 bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 active:scale-90 transition-transform"
          >
            <input
              type="color"
              value={background.color || '#14141a'}
              onChange={(e) => setBackground({ type: 'color', color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Upload Background Image */}
          <button
            title="Set wallpaper image"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-6 h-6 rounded-full border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-transform active:scale-90',
              background.type === 'image' && 'border-indigo-600 text-indigo-600 bg-indigo-50'
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
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Texture Pattern
        </div>
        <div className="grid grid-cols-4 gap-1">
          {PATTERN_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setBackground({ pattern: p.id })}
              className={cn(
                'py-1.5 rounded-lg border text-[11px] font-medium transition-all active:scale-95 text-center',
                (background.pattern ?? 'none') === p.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Clear Wallpaper */}
      <div className="pt-2 border-t border-neutral-100">
        <button
          onClick={() => {
            if (confirm('Clear the whole wallpaper?')) clearCanvas();
          }}
          className="w-full py-2 px-3 rounded-xl border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear Wallpaper
        </button>
      </div>
    </div>
  );
};
