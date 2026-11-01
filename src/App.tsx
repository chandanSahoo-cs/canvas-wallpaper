import { requestStoragePersistence, runAssetGarbageCollection, backfillManager } from "./lib/assets";
import { BackfillProgressIndicator } from "./components/ui/BackfillProgressIndicator";
import { ImageElement } from "./elements/types";
import React, { useEffect, useRef, useState } from "react";
import { useCanvas } from "./canvas/useCanvas";
import { InlineTextEditor } from "./components/InlineTextEditor";
import { SceneSwitcher } from "./components/SceneSwitcher";
import { ShortcutsDialog } from "./components/ShortcutsDialog";
import { StylePanel } from "./components/StylePanel";
import { Toolbar } from "./components/Toolbar";
import { WallpaperDock } from "./components/WallpaperDock";
import { WallpaperWidgets } from "./components/WallpaperWidgets";
import { PreviewPill } from "./components/PreviewPill";
import { SettingsDialog } from "./widgets/SettingsDialog";
import { WidgetLayoutOverlay } from "./widgets/WidgetLayoutOverlay";
import { OnboardingTour } from "./components/OnboardingTour";
import { PresetGalleryDialog } from "./components/PresetGalleryDialog";
import { LibraryModal } from "./components/library/LibraryModal";
import { useAppStore } from "./store/useAppStore";
import { useSceneStore } from "./store/useSceneStore";
import { useWidgetStore } from "./store/useWidgetStore";
import { useWallpaperBackground } from "./hooks/useWallpaperBackground";
import { useTextEditing } from "./hooks/useTextEditing";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useCanvasPaste } from "./hooks/useCanvasPaste";
import { useCanvasDrop } from "./hooks/useCanvasDrop";
import { Image as ImageIcon } from "lucide-react";
import { useViewportRecorder } from "./hooks/useViewportRecorder";
import { useViewportBoundary } from "./hooks/useViewportBoundary";
import { cn } from "./lib/utils";

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvas(canvasRef);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Store bindings
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const isPreviewing = useAppStore((s) => s.isPreviewing);
  const togglePreview = useAppStore((s) => s.togglePreview);
  const background = useAppStore((s) => s.background);
  const zoom = useAppStore((s) => s.zoom);
  const scrollOffset = useAppStore((s) => s.scrollOffset);
  const isPresetsOpen = useAppStore((s) => s.isPresetsOpen);
  const setIsPresetsOpen = useAppStore((s) => s.setIsPresetsOpen);
  const loadScenesFromStorage = useSceneStore((s) => s.loadScenesFromStorage);

  const isLayoutMode = useWidgetStore((s) => s.isLayoutMode);
  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);

  // Modular custom hooks for separated concerns
  const { bgStyle, isLight } = useWallpaperBackground(background);
  const { editingText, handleCommitText, handleCancelText } = useTextEditing();
  useKeyboardShortcuts({
    onToggleShortcuts: () => setIsShortcutsOpen((prev) => !prev),
  });
  useCanvasPaste();
  const { isDraggingOver } = useCanvasDrop({ canvasRef });
  useViewportRecorder(mode);
  useViewportBoundary();

  // Initialize storage
  useEffect(() => {
    loadScenesFromStorage();
    useWidgetStore.getState().loadFromStorage();
    requestStoragePersistence();

    // Startup garbage collection: collect all referenced asset IDs across all scenes
    setTimeout(async () => {
      const allScenes = useSceneStore.getState().scenes;
      const referenced = new Set<string>();
      for (const s of allScenes) {
        if (s.background?.type === "image" && s.background.imageAssetId) {
          referenced.add(s.background.imageAssetId);
        }
        for (const el of s.elements) {
          if (el.type === "image" && (el as ImageElement).assetId) {
            referenced.add((el as ImageElement).assetId);
          }
        }
      }
      await runAssetGarbageCollection(referenced);
      await backfillManager.scanAndStart();
    }, 2000);
  }, [loadScenesFromStorage]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={bgStyle}
    >
      {/* Interactive / Wallpaper Canvas */}
      <canvas
        ref={canvasRef}
        role="region"
        aria-label="PaperTab drawing canvas"
        className={cn(
          "absolute inset-0 w-full h-full touch-none",
          mode === "wallpaper" || isPreviewing
            ? "pointer-events-none"
            : "pointer-events-auto",
        )}
      />

      {/* Visual Drop Target Highlight */}
      {isDraggingOver && (
        <div className="absolute inset-4 pointer-events-none border-4 border-dashed border-brand-blue bg-brand-blue/10 rounded-sk-lg flex items-center justify-center z-50 animate-in fade-in duration-100">
          <div className="px-5 py-3 rounded-sk bg-surface border-2 border-line shadow-hard font-hand font-bold text-ink text-sm flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-blue-text" />
            <span>Drop images to place on canvas</span>
          </div>
        </div>
      )}

      {/* Excalidraw-style inline WYSIWYG text editor */}
      {mode === "drawing" && editingText && !isPreviewing && (
        <InlineTextEditor
          data={editingText}
          zoom={zoom}
          scrollOffset={scrollOffset}
          onCommit={handleCommitText}
          onCancel={handleCancelText}
        />
      )}

      {/* Wallpaper Mode & Preview Mode Widgets Overlay */}
      {(mode === "wallpaper" || isPreviewing) && !isLayoutMode && (
        <WallpaperWidgets isLight={isLight} />
      )}

      {/* Full-Screen Interactive Widget Layout Customizer */}
      {isLayoutMode && <WidgetLayoutOverlay isLight={isLight} />}

      {/* Floating Action Micro-Dock (Wallpaper Mode) */}
      {mode === "wallpaper" && !isLayoutMode && (
        <WallpaperDock
          isLight={isLight}
          onOpenPresets={() => setIsPresetsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenLayout={() => setIsLayoutMode(true)}
          onEnterDrawMode={() => setMode("drawing")}
        />
      )}

      {/* Settings Dialog Modal */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Keyboard Shortcuts Dialog Modal */}
      <ShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Wallpaper Presets & Templates Gallery Modal */}
      <PresetGalleryDialog
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onEnterDrawMode={() => setMode("drawing")}
      />

      {/* Drawing Mode UI Overlays */}
      {mode === "drawing" && !isPreviewing && (
        <>
          <Toolbar onOpenShortcuts={() => setIsShortcutsOpen(true)} />
          <StylePanel />
          <SceneSwitcher />
        </>
      )}

      {/* Floating Preview Pill when UI is hidden */}
      {mode === "drawing" && isPreviewing && (
        <PreviewPill onExitPreview={togglePreview} />
      )}

      {/* Feature Onboarding Tour & Welcome Modal */}
      <LibraryModal />
      <OnboardingTour />

      {/* Idle Metadata Backfill Progress */} 
      <BackfillProgressIndicator />
    </div>
  );
};
