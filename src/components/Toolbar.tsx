import React from 'react';
import {
  Pointer,
  Square,
  Diamond,
  Circle,
  MoveUpRight,
  Minus,
  Pencil,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Eye,
  Upload,
  FileCode,
  FileJson,
} from 'lucide-react';
import { exportWallpaperAsPng } from '../hooks/useExport';
import { exportWallpaperAsSvg } from '../hooks/useSvgExport';
import { exportWallpaperFile, importWallpaperFile } from '../hooks/useWallpaperFile';
import { useAppStore } from '../store/useAppStore';
import { useSceneStore } from '../store/useSceneStore';
import { ToolType } from '../elements/types';
import { cn } from '../lib/utils';

export const Toolbar: React.FC = () => {
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentTool = useAppStore((s) => s.currentTool);
  const setTool = useAppStore((s) => s.setTool);
  const setMode = useAppStore((s) => s.setMode);
  const togglePreview = useAppStore((s) => s.togglePreview);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const history = useAppStore((s) => s.history);
  const future = useAppStore((s) => s.future);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const resetZoom = useAppStore((s) => s.resetZoom);

  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'selection', label: 'Select', icon: <Pointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: 'R' },
    { id: 'diamond', label: 'Diamond', icon: <Diamond className="w-4 h-4" />, shortcut: 'D' },
    { id: 'ellipse', label: 'Ellipse', icon: <Circle className="w-4 h-4" />, shortcut: 'O' },
    { id: 'arrow', label: 'Arrow', icon: <MoveUpRight className="w-4 h-4" />, shortcut: 'A' },
    { id: 'line', label: 'Line', icon: <Minus className="w-4 h-4 rotate-45" />, shortcut: 'L' },
    { id: 'freedraw', label: 'Draw', icon: <Pencil className="w-4 h-4" />, shortcut: 'P' },
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, shortcut: 'T' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-lg rounded-2xl p-1.5 flex items-center gap-1">
      {tools.map((t) => (
        <button
          key={t.id}
          title={`${t.label} (${t.shortcut})`}
          onClick={() => setTool(t.id)}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
            currentTool === t.id
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95'
          )}
        >
          {t.icon}
        </button>
      ))}

      <div className="w-px h-6 bg-neutral-200 mx-1" />

      {/* Undo / Redo */}
      <button
        title="Undo (Ctrl+Z)"
        disabled={history.length === 0}
        onClick={undo}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
          history.length === 0
            ? 'opacity-30 cursor-not-allowed text-neutral-400'
            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95'
        )}
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        title="Redo (Ctrl+Shift+Z)"
        disabled={future.length === 0}
        onClick={redo}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
          future.length === 0
            ? 'opacity-30 cursor-not-allowed text-neutral-400'
            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95'
        )}
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-neutral-200 mx-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5 bg-neutral-100 rounded-xl px-1 py-0.5 text-xs text-neutral-600">
        <button
          title="Zoom Out"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="p-1 hover:text-neutral-900"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          title="Reset Zoom to 100%"
          onClick={resetZoom}
          className="font-medium px-1 hover:text-indigo-600"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          title="Zoom In"
          onClick={() => setZoom((z) => Math.min(5.0, z + 0.25))}
          className="p-1 hover:text-neutral-900"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-px h-6 bg-neutral-200 mx-1" />

      {/* Export / Share Menu */}
      <div className="relative">
        <button
          title="Export / Share Wallpaper"
          onClick={() => setIsExportMenuOpen((v) => !v)}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95',
            isExportMenuOpen
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
          )}
        >
          <Download className="w-4 h-4" />
        </button>

        {isExportMenuOpen && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-1.5 flex flex-col gap-0.5 w-52 text-xs select-none z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                exportWallpaperAsPng();
                setIsExportMenuOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              Save as PNG Image
            </button>
            <button
              onClick={() => {
                exportWallpaperAsSvg();
                setIsExportMenuOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
            >
              <FileCode className="w-4 h-4 text-rose-500" />
              Export as SVG Vector
            </button>
            <div className="w-full h-px bg-neutral-100 my-0.5" />
            <button
              onClick={() => {
                const currentScene = useSceneStore
                  .getState()
                  .scenes.find((s) => s.id === useSceneStore.getState().activeSceneId);
                exportWallpaperFile(currentScene?.name);
                setIsExportMenuOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
            >
              <FileJson className="w-4 h-4 text-amber-500" />
              Export Wallpaper File
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setIsExportMenuOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              Import Wallpaper File...
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".canvaswallpaper,.json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            await importWallpaperFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Preview Wallpaper */}
      <button
        title="Preview Wallpaper without UI (H)"
        onClick={togglePreview}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-150 active:scale-95"
      >
        <Eye className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-neutral-200 mx-1" />

      {/* Done / Exit drawing mode button */}
      <button
        title="Exit drawing mode"
        onClick={() => setMode('wallpaper')}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-900 text-white hover:bg-neutral-800 transition-all duration-150 shadow-sm active:scale-95"
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
};
