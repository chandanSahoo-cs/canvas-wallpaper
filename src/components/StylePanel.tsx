import React, { useRef, useState } from 'react';
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
  Sliders,
  Paintbrush,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn, isColorLight } from '../lib/utils';
import { FillStyle, StrokeStyle, FontFamily, TextElement } from '../elements/types';
import { FONT_SIZE_MAP } from '../canvas/geometry';

export const StylePanel: React.FC = () => {
  const currentTool = useAppStore((s) => s.currentTool);
  const currentFontFamily = useAppStore((s) => s.currentFontFamily);
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

  // Tab state when no element is selected: 'canvas' | 'defaults'
  const [activeTab, setActiveTab] = useState<'canvas' | 'defaults'>('canvas');

  const isLightBg = isColorLight(background.color || '#14141a');
  const strokePresets = isLightBg
    ? ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#ffffff']
    : ['#ffffff', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#1e1e1e'];
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

  const isTextOnly =
    (hasSelection && selectedMembers.every((m) => m.type === 'text')) ||
    (!hasSelection && currentTool === 'text');

  const firstSelected = hasSelection ? selectedMembers[0] : null;

  const activeStrokeColor = firstSelected ? firstSelected.strokeColor : currentStrokeColor;
  const activeFillColor = firstSelected ? firstSelected.fillColor : currentFillColor;
  const activeStrokeWidth = firstSelected ? firstSelected.strokeWidth : currentStrokeWidth;
  const activeStrokeStyle = firstSelected ? (firstSelected.strokeStyle || 'solid') : currentStrokeStyle;
  const activeFillStyle = firstSelected ? (firstSelected.fillStyle || 'solid') : currentFillStyle;
  const activeRoughness = firstSelected ? (firstSelected.roughness ?? 1.4) : currentRoughness;
  const activeOpacity = firstSelected ? (firstSelected.opacity ?? 100) : currentOpacity;
  const activeFontFamily = firstSelected?.type === 'text'
    ? (firstSelected as TextElement).fontFamily || 'handwritten'
    : currentFontFamily;
  const activeFontSize = firstSelected?.type === 'text'
    ? (firstSelected as TextElement).fontSize || FONT_SIZE_MAP[firstSelected.strokeWidth] || 20
    : FONT_SIZE_MAP[currentStrokeWidth] || 20;

  const handleFontFamilyChange = (fontFamily: FontFamily) => {
    setCurrentStyles({ fontFamily });
    if (hasSelection) updateSelectedElements({ fontFamily } as any);
  };

  const handleFontSizeChange = (fontSize: number) => {
    const matchingWidth = Object.entries(FONT_SIZE_MAP).find(([, size]) => size === fontSize)?.[0];
    if (matchingWidth) {
      setCurrentStyles({ strokeWidth: Number(matchingWidth) });
    }
    if (hasSelection) updateSelectedElements({ fontSize } as any);
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

  // Determine whether to show Element Styles view vs Canvas view
  const isDrawingTool = currentTool !== 'selection';
  const showElementProperties = hasSelection || isDrawingTool || activeTab === 'defaults';

  return (
    <div className="fixed top-20 left-4 z-20 w-60 max-h-[calc(100vh-6rem)] bg-white/95 backdrop-blur-xl border border-neutral-200/80 shadow-xl rounded-2xl p-3.5 flex flex-col gap-3.5 text-xs select-none overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-200 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      {/* Header / Mode Switcher when nothing is selected */}
      {!hasSelection && !isDrawingTool && (
        <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl">
          <button
            onClick={() => setActiveTab('canvas')}
            className={cn(
              'flex-1 py-1 rounded-lg font-medium text-[11px] transition-all flex items-center justify-center gap-1.5',
              activeTab === 'canvas'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            )}
          >
            <Palette className="w-3.5 h-3.5" /> Canvas
          </button>
          <button
            onClick={() => setActiveTab('defaults')}
            className={cn(
              'flex-1 py-1 rounded-lg font-medium text-[11px] transition-all flex items-center justify-center gap-1.5',
              activeTab === 'defaults'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            )}
          >
            <Sliders className="w-3.5 h-3.5" /> Tool Defaults
          </button>
        </div>
      )}

      {/* Selected Indicator Badge */}
      {hasSelection && (
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <span className="text-[11px] font-semibold text-neutral-700">
            {selectedMembers.length} {selectedMembers.length === 1 ? 'Element' : 'Elements'} Selected
          </span>
          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
            Properties
          </span>
        </div>
      )}

      {/* VIEW A: CANVAS WALLPAPER SETTINGS */}
      {!showElementProperties ? (
        <div className="flex flex-col gap-4">
          {/* Background Color */}
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2">
              Background Color
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
              {[
                { id: 'none', label: 'None' },
                { id: 'dots', label: 'Dots' },
                { id: 'grid', label: 'Grid' },
                { id: 'lines', label: 'Lines' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBackground({ pattern: p.id as any })}
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
      ) : (
        /* VIEW B: ELEMENT OR DRAWING DEFAULT PROPERTIES */
        <div className="flex flex-col gap-3.5">
          {/* Stroke Color */}
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
              Stroke
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {strokePresets.map((c) => (
                <button
                  key={c}
                  onClick={() => handleStrokeChange(c)}
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
                  onChange={(e) => handleStrokeChange(e.target.value)}
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
              {fillPresets.map((c) => (
                <button
                  key={c}
                  onClick={() => handleFillChange(c)}
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
                  onChange={(e) => handleFillChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
          </div>

          {/* Font Family (if text) */}
          {isTextOnly && (
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
                Font Family
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'handwritten', label: 'Hand-drawn' },
                  { id: 'sans', label: 'Normal' },
                  { id: 'monospace', label: 'Code' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleFontFamilyChange(f.id as FontFamily)}
                    className={cn(
                      'py-1 rounded-lg border text-[11px] font-medium transition-all active:scale-95',
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
          )}

          {/* Font Size (if text) */}
          {isTextOnly && (
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
                Font Size
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { size: 16, label: 'S' },
                  { size: 20, label: 'M' },
                  { size: 28, label: 'L' },
                  { size: 36, label: 'XL' },
                ].map((s) => (
                  <button
                    key={s.size}
                    onClick={() => handleFontSizeChange(s.size)}
                    className={cn(
                      'py-1 rounded-lg border text-[11px] font-medium transition-all active:scale-95',
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
          )}

          {!isTextOnly && (
            <>
              {/* Fill Style with Visual SVG Icons */}
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
                  Fill Style
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    {
                      id: 'solid',
                      label: 'Solid',
                      icon: (
                        <svg className="w-5 h-3" viewBox="0 0 20 12">
                          <rect width="20" height="12" rx="2" fill="currentColor" opacity="0.8" />
                        </svg>
                      ),
                    },
                    {
                      id: 'hachure',
                      label: 'Hachure',
                      icon: (
                        <svg className="w-5 h-3" viewBox="0 0 20 12">
                          <rect width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                          <line x1="2" y1="12" x2="12" y2="0" stroke="currentColor" strokeWidth="1.2" />
                          <line x1="7" y1="12" x2="17" y2="0" stroke="currentColor" strokeWidth="1.2" />
                          <line x1="12" y1="12" x2="20" y2="2" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      ),
                    },
                    {
                      id: 'cross-hatch',
                      label: 'Cross',
                      icon: (
                        <svg className="w-5 h-3" viewBox="0 0 20 12">
                          <rect width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                          <line x1="2" y1="12" x2="12" y2="0" stroke="currentColor" strokeWidth="1" />
                          <line x1="10" y1="12" x2="20" y2="0" stroke="currentColor" strokeWidth="1" />
                          <line x1="2" y1="0" x2="12" y2="12" stroke="currentColor" strokeWidth="1" />
                          <line x1="10" y1="0" x2="20" y2="12" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      ),
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleFillStyleChange(f.id as any)}
                      title={f.label}
                      className={cn(
                        'py-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all active:scale-95',
                        activeFillStyle === f.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      )}
                    >
                      {f.icon}
                      <span className="text-[10px] font-medium leading-none">{f.label}</span>
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
                  {[
                    {
                      id: 'solid',
                      label: 'Solid',
                      svg: (
                        <svg className="w-7 h-2" viewBox="0 0 28 8">
                          <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                      ),
                    },
                    {
                      id: 'dashed',
                      label: 'Dashed',
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
                      id: 'dotted',
                      label: 'Dotted',
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
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStrokeStyleChange(s.id as any)}
                      title={s.label}
                      className={cn(
                        'py-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all active:scale-95',
                        activeStrokeStyle === s.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      )}
                    >
                      {s.svg}
                      <span className="text-[10px] font-medium leading-none">{s.label}</span>
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
                  {[
                    { val: 0.2, label: 'Clean' },
                    { val: 1.4, label: 'Sketch' },
                    { val: 2.5, label: 'Rough' },
                  ].map((r) => (
                    <button
                      key={r.val}
                      onClick={() => handleRoughnessChange(r.val)}
                      className={cn(
                        'py-1.5 rounded-lg border text-[11px] font-medium transition-all active:scale-95',
                        Math.abs(activeRoughness - r.val) < 0.3
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
                <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
                  Stroke Width
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { size: 1.5, label: 'Thin', dot: 4 },
                    { size: 3, label: 'Medium', dot: 7 },
                    { size: 5.5, label: 'Thick', dot: 11 },
                  ].map((s) => (
                    <button
                      key={s.size}
                      onClick={() => handleWidthChange(s.size)}
                      title={s.label}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg flex items-center justify-center border transition-all active:scale-95',
                        activeStrokeWidth === s.size
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
            </>
          )}

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1">
              <span>Opacity</span>
              <span>{activeOpacity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={activeOpacity}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Selected Element Actions (Layers, Group, Lock, Duplicate, Delete) */}
          {hasSelection && (
            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
              <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                Actions
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button
                  title="Duplicate"
                  onClick={duplicateSelected}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  title={isLocked ? 'Unlock' : 'Lock'}
                  onClick={toggleLockSelected}
                  className={cn(
                    'p-1.5 rounded-lg border flex items-center justify-center active:scale-95 transition-all',
                    isLocked
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  )}
                >
                  {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </button>
                <button
                  title="Delete"
                  onClick={deleteSelected}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  title={selectedMembers.some((el) => (el.groupIds?.length ?? 0) > 0) ? 'Ungroup' : 'Group'}
                  onClick={selectedMembers.some((el) => (el.groupIds?.length ?? 0) > 0) ? ungroupSelected : groupSelected}
                  disabled={!selectedMembers.some((el) => (el.groupIds?.length ?? 0) > 0) && selectedMembers.length < 2}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
                >
                  {selectedMembers.some((el) => (el.groupIds?.length ?? 0) > 0) ? (
                    <Ungroup className="w-3.5 h-3.5" />
                  ) : (
                    <Group className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Layer arrange */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  title="Send Backward"
                  onClick={sendBackward}
                  className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  title="Bring Forward"
                  onClick={sendForward}
                  className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
                >
                  <ArrowUpToLine className="w-3.5 h-3.5" /> Front
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
