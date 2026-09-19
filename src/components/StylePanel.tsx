import React, { useRef } from 'react';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Group,
  Ungroup,
  ArrowDownToLine,
  ArrowUpToLine,
  RotateCcw,
  Image as ImageIcon,
  Palette,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { FillStyle, StrokeStyle } from '../elements/types';

export const StylePanel: React.FC = () => {
  const currentStrokeColor = useAppStore((s) => s.currentStrokeColor);
  const currentFillColor = useAppStore((s) => s.currentFillColor);
  const currentStrokeWidth = useAppStore((s) => s.currentStrokeWidth);
  const currentOpacity = useAppStore((s) => s.currentOpacity);
  const currentFillStyle = useAppStore((s) => s.currentFillStyle);
  const currentStrokeStyle = useAppStore((s) => s.currentStrokeStyle);
  const currentRoughness = useAppStore((s) => s.currentRoughness);
  const background = useAppStore((s) => s.background);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const elements = useAppStore((s) => s.elements);

  const setCurrentStyles = useAppStore((s) => s.setCurrentStyles);
  const updateSelectedElements = useAppStore((s) => s.updateSelectedElements);
  const setBackground = useAppStore((s) => s.setBackground);
  const duplicateSelected = useAppStore((s) => s.duplicateSelected);
  const deleteSelected = useAppStore((s) => s.deleteSelected);
  const toggleLockSelected = useAppStore((s) => s.toggleLockSelected);
  const groupSelected = useAppStore((s) => s.groupSelected);
  const ungroupSelected = useAppStore((s) => s.ungroupSelected);
  const sendBackward = useAppStore((s) => s.sendBackward);
  const sendForward = useAppStore((s) => s.sendForward);
  const clearCanvas = useAppStore((s) => s.clearCanvas);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const strokePresets = ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#ffffff'];
  const fillPresets = ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99', '#f3f0ff'];
  const bgPresets = ['#14141a', '#1e1e24', '#f5f5f7', '#0b3d91', '#2d6a4f', '#2b1b3d'];

  const selectedMembers = elements.filter((el) => selectedIds.has(el.id));
  const hasSelection = selectedMembers.length > 0;
  const isLocked = hasSelection && selectedMembers.every((el) => el.locked);

  const handleStrokeChange = (color: string) => {
    setCurrentStyles({ strokeColor: color });
    if (hasSelection) updateSelectedElements({ strokeColor: color });
  };

  const handleFillChange = (color: string) => {
    setCurrentStyles({ fillColor: color });
    if (hasSelection) updateSelectedElements({ fillColor: color });
  };

  const handleFillStyleChange = (style: FillStyle) => {
    setCurrentStyles({ fillStyle: style });
    if (hasSelection) updateSelectedElements({ fillStyle: style });
  };

  const handleStrokeStyleChange = (style: StrokeStyle) => {
    setCurrentStyles({ strokeStyle: style });
    if (hasSelection) updateSelectedElements({ strokeStyle: style });
  };

  const handleRoughnessChange = (roughness: number) => {
    setCurrentStyles({ roughness });
    if (hasSelection) updateSelectedElements({ roughness });
  };

  const handleWidthChange = (width: number) => {
    setCurrentStyles({ strokeWidth: width });
    if (hasSelection) updateSelectedElements({ strokeWidth: width });
  };

  const handleOpacityChange = (opacity: number) => {
    setCurrentStyles({ opacity });
    if (hasSelection) updateSelectedElements({ opacity });
  };

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
    <div className="fixed top-20 left-4 bottom-4 w-56 z-20 bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-lg rounded-2xl p-4 overflow-y-auto flex flex-col gap-4 text-xs select-none">
      {/* Stroke Color */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Stroke
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {strokePresets.map((c) => (
            <button
              key={c}
              onClick={() => handleStrokeChange(c)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform active:scale-90',
                currentStrokeColor === c
                  ? 'border-indigo-600 scale-110 shadow-sm'
                  : 'border-black/10 hover:scale-105'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="w-6 h-6 rounded-full overflow-hidden relative cursor-pointer border border-neutral-200 bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 active:scale-90 transition-transform">
            <input
              type="color"
              value={currentStrokeColor}
              onChange={(e) => handleStrokeChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* Fill Color */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Fill
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {fillPresets.map((c) => (
            <button
              key={c}
              onClick={() => handleFillChange(c)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform active:scale-90',
                currentFillColor === c
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
              value={currentFillColor === 'transparent' ? '#ffffff' : currentFillColor}
              onChange={(e) => handleFillChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* Fill Style */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Fill Style
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'solid', label: 'Solid' },
            { id: 'hachure', label: 'Hachure' },
            { id: 'cross-hatch', label: 'Cross' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleFillStyleChange(f.id as any)}
              className={cn(
                'py-1 rounded-lg border text-[11px] font-medium transition-all active:scale-95',
                currentFillStyle === f.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Style */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Stroke Style
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'solid', label: 'Solid' },
            { id: 'dashed', label: 'Dashed' },
            { id: 'dotted', label: 'Dotted' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => handleStrokeStyleChange(s.id as any)}
              className={cn(
                'py-1 rounded-lg border text-[11px] font-medium transition-all active:scale-95',
                currentStrokeStyle === s.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Roughness / Sketchiness */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Aesthetic
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { val: 0.2, label: 'Clean' },
            { val: 1.4, label: 'Sketch' },
            { val: 2.5, label: 'Rough' },
          ].map((r) => (
            <button
              key={r.val}
              onClick={() => handleRoughnessChange(r.val)}
              className={cn(
                'py-1 rounded-lg border text-[11px] font-medium transition-all active:scale-95',
                currentRoughness === r.val
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Stroke Width
        </div>
        <div className="flex items-center gap-1">
          {[
            { size: 1.5, label: 'Thin', dot: 4 },
            { size: 3, label: 'Medium', dot: 8 },
            { size: 5.5, label: 'Thick', dot: 12 },
          ].map((s) => (
            <button
              key={s.size}
              onClick={() => handleWidthChange(s.size)}
              title={s.label}
              className={cn(
                'flex-1 py-1.5 rounded-lg flex items-center justify-center border transition-all active:scale-95',
                currentStrokeWidth === s.size
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
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

      {/* Opacity */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1">
          <span>Opacity</span>
          <span>{currentOpacity}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={currentOpacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Selected Element Actions */}
      {hasSelection && (
        <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
          <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
            Selected
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              title="Duplicate"
              onClick={duplicateSelected}
              className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              title="Delete"
              onClick={deleteSelected}
              className="p-2 rounded-lg border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              title={isLocked ? 'Unlock' : 'Lock'}
              onClick={toggleLockSelected}
              className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
            >
              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              title="Group selected"
              disabled={selectedMembers.length < 2}
              onClick={groupSelected}
              className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
            >
              <Group className="w-3.5 h-3.5" /> Group
            </button>
            <button
              title="Ungroup selected"
              onClick={ungroupSelected}
              className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
            >
              <Ungroup className="w-3.5 h-3.5" /> Ungroup
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              title="Send backward"
              onClick={sendBackward}
              className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Back
            </button>
            <button
              title="Send forward"
              onClick={sendForward}
              className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" /> Front
            </button>
          </div>
        </div>
      )}

      {/* Wallpaper Background Settings */}
      <div className="pt-2 border-t border-neutral-100">
        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
          Wallpaper Background
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {bgPresets.map((c) => (
            <button
              key={c}
              onClick={() => setBackground({ type: 'color', color: c })}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform active:scale-90',
                background.type === 'color' && background.color === c
                  ? 'border-indigo-600 scale-110 shadow-sm'
                  : 'border-black/10 hover:scale-105'
              )}
              style={{ backgroundColor: c }}
            />
          ))}

          {/* Custom color picker */}
          <label className="w-6 h-6 rounded-full overflow-hidden relative cursor-pointer border border-neutral-200 bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 active:scale-90 transition-transform">
            <input
              type="color"
              value={background.color || '#14141a'}
              onChange={(e) => setBackground({ type: 'color', color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Upload Background Image */}
          <button
            title="Set custom background image"
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

      {/* Clear Canvas */}
      <div className="mt-auto pt-2 border-t border-neutral-100">
        <button
          onClick={() => {
            if (confirm('Clear the whole wallpaper?')) clearCanvas();
          }}
          className="w-full py-1.5 px-3 rounded-lg border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>
    </div>
  );
};
