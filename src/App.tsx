import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Image as ImageIcon, EyeOff, Settings } from 'lucide-react';
import { useCanvas } from './canvas/useCanvas';
import { useAppStore } from './store/useAppStore';
import { useSceneStore } from './store/useSceneStore';
import { useWidgetStore } from './store/useWidgetStore';
import { Toolbar } from './components/Toolbar';
import { StylePanel } from './components/StylePanel';
import { ClockWidget } from './widgets/ClockWidget';
import { SearchBar } from './widgets/SearchBar';
import { QuickLinks } from './widgets/QuickLinks';
import { SettingsDialog } from './widgets/SettingsDialog';
import { ToolType, ImageElement } from './elements/types';
import { newId, randomSeed } from './lib/utils';
import { cn } from './lib/utils';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvas(canvasRef);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const isPreviewing = useAppStore((s) => s.isPreviewing);
  const togglePreview = useAppStore((s) => s.togglePreview);
  const currentTool = useAppStore((s) => s.currentTool);
  const setTool = useAppStore((s) => s.setTool);
  const background = useAppStore((s) => s.background);
  const elements = useAppStore((s) => s.elements);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const duplicateSelected = useAppStore((s) => s.duplicateSelected);
  const deleteSelected = useAppStore((s) => s.deleteSelected);
  const sendBackward = useAppStore((s) => s.sendBackward);
  const sendForward = useAppStore((s) => s.sendForward);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const setElements = useAppStore((s) => s.setElements);
  const saveToStorage = useAppStore((s) => s.saveToStorage);
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);

  const scenes = useSceneStore((s) => s.scenes);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const switchScene = useSceneStore((s) => s.switchScene);
  const createScene = useSceneStore((s) => s.createScene);
  const loadScenesFromStorage = useSceneStore((s) => s.loadScenesFromStorage);

  // Initialize storage
  useEffect(() => {
    loadFromStorage();
    loadScenesFromStorage();
    useWidgetStore.getState().loadFromStorage();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle drawing mode with Space or E if in wallpaper mode
      if (mode === 'wallpaper') {
        if (e.key === 'e' || e.key === 'E') {
          setMode('drawing');
          return;
        }
      }

      if (mode !== 'drawing') return;
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }

      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (mod && key === 'a') {
        e.preventDefault();
        const unlocked = elements.filter((el) => !el.locked).map((el) => el.id);
        setSelectedIds(unlocked);
        return;
      }
      if (mod && key === ']') {
        e.preventDefault();
        sendForward();
        return;
      }
      if (mod && key === '[') {
        e.preventDefault();
        sendBackward();
        return;
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        return;
      }

      if (key === 'h' && !mod) {
        e.preventDefault();
        togglePreview();
        return;
      }

      // Arrow keys nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.size > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        pushHistory();
        setElements(
          elements.map((el) => {
            if (!selectedIds.has(el.id) || el.locked) return el;
            if ('points' in el && el.points) {
              return {
                ...el,
                points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              } as any;
            } else if ('x' in el) {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
              };
            }
            return el;
          })
        );
        saveToStorage();
        return;
      }

      // Tool switching shortcuts
      const toolMap: Record<string, ToolType> = {
        v: 'selection',
        r: 'rectangle',
        d: 'diamond',
        o: 'ellipse',
        a: 'arrow',
        l: 'line',
        p: 'freedraw',
        t: 'text',
        e: 'eraser',
      };
      if (toolMap[key]) {
        setTool(toolMap[key]);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        deleteSelected();
      }
    };

    // Paste handler for images
    const handlePaste = (e: ClipboardEvent) => {
      if (mode !== 'drawing') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const img = new Image();
            img.onload = () => {
              const maxW = 400;
              const maxH = 300;
              const scale = Math.min(maxW / img.width, maxH / img.height, 1);
              const w = img.width * scale;
              const h = img.height * scale;

              const imageEl: ImageElement = {
                id: newId(),
                type: 'image',
                angle: 0,
                locked: false,
                groupIds: [],
                x: window.innerWidth / 2 - w / 2,
                y: window.innerHeight / 2 - h / 2,
                width: w,
                height: h,
                dataUrl,
                strokeColor: '#1e1e1e',
                fillColor: 'transparent',
                strokeWidth: 1.5,
                opacity: 100,
                seed: randomSeed(),
              };

              pushHistory();
              setElements([...useAppStore.getState().elements, imageEl]);
              setSelectedIds([imageEl.id]);
              saveToStorage();
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [mode, elements, selectedIds]);

  // Background styling with gradient and pattern overlays
  const patternOverlays: Record<string, { image: string; size: string }> = {
    dots: {
      image: 'radial-gradient(rgba(255,255,255,0.15) 1.2px, transparent 1.2px)',
      size: '24px 24px',
    },
    grid: {
      image:
        'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
      size: '24px 24px, 24px 24px',
    },
    lines: {
      image: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
      size: '100% 28px',
    },
  };

  const pattern = background.pattern && background.pattern !== 'none' ? patternOverlays[background.pattern] : null;
  const baseBg =
    background.type === 'image' && background.imageUrl
      ? `url(${background.imageUrl})`
      : background.type === 'gradient' && background.gradient
      ? background.gradient
      : undefined;

  const bgStyle: React.CSSProperties = {
    backgroundColor: background.color || '#14141a',
    backgroundImage: pattern ? (baseBg ? `${pattern.image}, ${baseBg}` : pattern.image) : baseBg,
    backgroundSize: pattern ? (baseBg ? `${pattern.size}, cover` : pattern.size) : 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none" style={bgStyle}>
      {/* Interactive / Wallpaper Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 w-full h-full touch-none',
          mode === 'wallpaper' ? 'pointer-events-none' : 'pointer-events-auto'
        )}
      />

      {/* Wallpaper Mode Widgets Overlay */}
      {mode === 'wallpaper' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 gap-8 pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-6 w-full max-w-xl">
            <ClockWidget />
            <SearchBar />
            <QuickLinks />
          </div>
        </div>
      )}

      {/* Floating Action Buttons (Wallpaper Mode) */}
      {mode === 'wallpaper' && (
        <div className="fixed bottom-6 right-6 z-20 flex items-center gap-2.5">
          <button
            title="Widget Settings"
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            title="Customize Wallpaper (Press E or click)"
            onClick={() => setMode('drawing')}
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Settings Dialog Modal */}
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Drawing Mode UI Overlays */}
      {mode === 'drawing' && !isPreviewing && (
        <>
          <Toolbar />
          <StylePanel />

          {/* Scene Switcher (Top Left) */}
          <div className="fixed top-4 left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-lg rounded-2xl p-1.5 text-xs">
            <select
              value={activeSceneId}
              onChange={(e) => switchScene(e.target.value)}
              className="bg-transparent font-medium text-neutral-800 py-1 px-2 rounded-lg outline-none cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => createScene()}
              title="Add New Wallpaper Scene"
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors active:scale-95"
            >
              + New
            </button>
          </div>
        </>
      )}

      {/* Floating Preview Pill when UI is hidden */}
      {mode === 'drawing' && isPreviewing && (
        <button
          onClick={togglePreview}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/85 hover:bg-neutral-900 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xl active:scale-95 transition-all border border-white/10"
        >
          <EyeOff className="w-3.5 h-3.5" /> Exit Preview (H)
        </button>
      )}
    </div>
  );
};
