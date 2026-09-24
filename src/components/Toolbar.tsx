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
  Download,
  Eye,
  Upload,
  FileCode,
  FileJson,
  Image as ImageIcon,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { exportWallpaperAsPng } from '../hooks/useExport';
import { exportWallpaperAsSvg } from '../hooks/useSvgExport';
import { exportWallpaperFile, importWallpaperFile } from '../hooks/useWallpaperFile';
import { insertImageFromFile } from '../lib/imageInsert';
import { createPaperTabCalligraphyElements } from '../lib/calligraphyPreset';
import { useAppStore } from '../store/useAppStore';
import { useSceneStore } from '../store/useSceneStore';
import { ToolType } from '../elements/types';
import { cn } from '../lib/utils';

interface ToolbarProps {
  onOpenShortcuts?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenShortcuts }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const currentTool = useAppStore((s) => s.currentTool);
  const setTool = useAppStore((s) => s.setTool);
  const setMode = useAppStore((s) => s.setMode);
  const togglePreview = useAppStore((s) => s.togglePreview);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const history = useAppStore((s) => s.history);
  const future = useAppStore((s) => s.future);
  const elements = useAppStore((s) => s.elements);
  const setElements = useAppStore((s) => s.setElements);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const saveToStorage = useAppStore((s) => s.saveToStorage);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const resetZoom = useAppStore((s) => s.resetZoom);

  const handleInsertCalligraphy = () => {
    const signature = createPaperTabCalligraphyElements({
      primaryColor: useAppStore.getState().currentStrokeColor || '#818cf8',
    });
    pushHistory();
    setElements([...elements, ...signature]);
    setSelectedIds(new Set(signature.map((s) => s.id)));
    setTool('selection');
    saveToStorage();
  };

  // Close export menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-xl border border-neutral-200/80 shadow-xl rounded-2xl p-1.5 flex items-center gap-1 select-none">
      {/* Cluster 1: Primary Tools */}
      <div className="flex items-center gap-0.5">
        {tools.map((t) => (
          <button
            key={t.id}
            title={`${t.label} (${t.shortcut})`}
            onClick={() => setTool(t.id)}
            className={cn(
              'w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all duration-150',
              currentTool === t.id
                ? 'bg-indigo-600 text-white shadow-sm scale-102 font-medium'
                : 'text-neutral-700 hover:bg-neutral-100/90 hover:text-neutral-900 active:scale-95'
            )}
          >
            {t.icon}
          </button>
        ))}

        {/* Insert Image Button */}
        <button
          title="Insert Image (or paste with Ctrl+V)"
          onClick={() => imageInputRef.current?.click()}
          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-neutral-100/90 hover:text-neutral-900 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Insert 'PaperTab' Calligraphy Signature */}
        <button
          title="Insert 'PaperTab' Calligraphy Signature"
          aria-label="Insert 'PaperTab' Calligraphy Signature"
          onClick={handleInsertCalligraphy}
          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await insertImageFromFile(file);
              e.target.value = '';
            }
          }}
        />
      </div>

      <div className="w-px h-5 bg-neutral-200/80 mx-1 shrink-0" />

      {/* Cluster 2: History (Undo/Redo) & Unified Zoom Pill */}
      <div className="flex items-center gap-1">
        <button
          title="Undo (Ctrl+Z)"
          disabled={history.length === 0}
          onClick={undo}
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
            history.length === 0
              ? 'opacity-25 cursor-not-allowed text-neutral-400'
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
            'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
            future.length === 0
              ? 'opacity-25 cursor-not-allowed text-neutral-400'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95'
          )}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Unified Segmented Zoom Controller Pill */}
        <div className="flex items-center bg-neutral-100/90 rounded-xl px-1 py-0.5 text-xs text-neutral-700 font-mono">
          <button
            title="Zoom Out"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 hover:text-neutral-900 hover:bg-white/80 rounded-lg active:scale-90 transition-all"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            title="Reset Zoom to 100%"
            onClick={resetZoom}
            className="font-medium px-1.5 py-0.5 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all text-[11px]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            title="Zoom In"
            onClick={() => setZoom((z) => Math.min(5.0, z + 0.25))}
            className="p-1 hover:text-neutral-900 hover:bg-white/80 rounded-lg active:scale-90 transition-all"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="w-px h-5 bg-neutral-200/80 mx-1 shrink-0" />

      {/* Cluster 3: Export, Preview & Done */}
      <div className="flex items-center gap-1">
        {/* Export / Share Menu */}
        <div ref={menuRef} className="relative">
          <button
            title="Export / Share Wallpaper"
            onClick={() => setIsExportMenuOpen((v) => !v)}
            className={cn(
              'w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95',
              isExportMenuOpen
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
            )}
          >
            <Download className="w-4 h-4" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/90 p-1.5 flex flex-col gap-0.5 w-52 text-xs select-none z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  exportWallpaperAsPng();
                  setIsExportMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Save as PNG Image</span>
              </button>
              <button
                onClick={() => {
                  exportWallpaperAsSvg();
                  setIsExportMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
              >
                <FileCode className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Export as SVG Vector</span>
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
                className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
              >
                <FileJson className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Export Wallpaper File</span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsExportMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Import Wallpaper File...</span>
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

        {/* Keyboard Shortcuts */}
        {onOpenShortcuts && (
          <button
            title="Keyboard Shortcuts (?)"
            onClick={onOpenShortcuts}
            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-150 active:scale-95"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        {/* Preview Wallpaper */}
        <button
          title="Preview Wallpaper (H)"
          onClick={togglePreview}
          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-150 active:scale-95"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Done / Exit Drawing Mode */}
        <button
          title="Exit Drawing Mode"
          onClick={() => setMode('wallpaper')}
          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center bg-neutral-900 text-white hover:bg-neutral-800 transition-all duration-150 shadow-xs active:scale-95 ml-0.5"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
