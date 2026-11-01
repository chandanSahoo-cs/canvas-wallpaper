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
import { LightboxModal } from "./components/lightbox/LightboxModal";
import { InboxTray } from "./components/inbox/InboxTray";
import { useAppStore } from "./store/useAppStore";
import { useSceneStore } from "./store/useSceneStore";
import { useResurfaceStore } from "./lib/resurface/store";
import { useWidgetStore } from "./store/useWidgetStore";
import { useWallpaperBackground } from "./hooks/useWallpaperBackground";
import { useTextEditing } from "./hooks/useTextEditing";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useCanvasPaste } from "./hooks/useCanvasPaste";
import { useCanvasDrop } from "./hooks/useCanvasDrop";
import { Image as ImageIcon, ExternalLink } from "lucide-react";
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
  const scenes = useSceneStore((s) => s.scenes);

  const resurfaceConfig = useResurfaceStore((s) => s.config);
  const resurfacePick = useResurfaceStore((s) => s.currentPick);
  const itemImageUrl = useResurfaceStore((s) => s.itemImageUrl);

  const effectiveBackground = React.useMemo(() => {
    if (mode === "wallpaper" && resurfacePick.type === "board" && resurfacePick.boardId) {
      const pickedScene = scenes.find((s) => s.id === resurfacePick.boardId);
      if (pickedScene?.background) {
        return pickedScene.background;
      }
    }
    return background;
  }, [mode, resurfacePick, scenes, background]);

  const isLayoutMode = useWidgetStore((s) => s.isLayoutMode);
  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);

  // Modular custom hooks for separated concerns
  const { bgStyle, isLight } = useWallpaperBackground(effectiveBackground);
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
    loadScenesFromStorage().then(() => {
      useResurfaceStore.getState().syncFromScenes(useSceneStore.getState().scenes);
    });
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

      {/* Resurfaced Full-Screen Item Image (Wallpaper Mode) */}
      {mode === "wallpaper" && resurfacePick.type === "item" && itemImageUrl && (
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
          <img
            src={itemImageUrl}
            alt={resurfacePick.item?.title || "Resurfaced wallpaper item"}
            className={cn(
              "w-full h-full select-none pointer-events-none",
              resurfaceConfig.fit === "cover" ? "object-cover" : "object-contain",
            )}
          />
        </div>
      )}

      {/* Resurfaced Item Caption & Source Overlay */}
      {mode === "wallpaper" &&
        resurfacePick.type === "item" &&
        resurfaceConfig.showCaption &&
        (resurfacePick.item?.caption ||
          resurfacePick.item?.title ||
          resurfacePick.item?.sourceUrl) && (
          <div className="fixed bottom-6 left-6 z-20 pointer-events-auto max-w-sm rounded-sk-lg bg-surface/95 text-ink border-2 border-line shadow-hard p-3 backdrop-blur-md flex flex-col gap-1 select-none animate-in fade-in duration-200">
            {(resurfacePick.item?.caption || resurfacePick.item?.title) && (
              <div className="font-hand font-bold text-sm text-ink line-clamp-2">
                {resurfacePick.item.caption || resurfacePick.item.title}
              </div>
            )}
            {resurfacePick.item?.sourceUrl && (
              <a
                href={resurfacePick.item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-blue hover:underline truncate"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {resurfacePick.item.sourceTitle || resurfacePick.item.sourceUrl}
                </span>
              </a>
            )}
          </div>
        )}

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
          <div className="fixed top-4 left-4 z-30">
            <SceneSwitcher />
          </div>
          <InboxTray onOpenSettings={() => setIsSettingsOpen(true)} />
        </>
      )}

      {/* Floating Preview Pill when UI is hidden */}
      {mode === "drawing" && isPreviewing && (
        <PreviewPill onExitPreview={togglePreview} />
      )}

      {/* Feature Onboarding Tour & Welcome Modal */}
      <LibraryModal />
      <LightboxModal />
      <OnboardingTour />

      {/* Idle Metadata Backfill Progress */} 
      <BackfillProgressIndicator />
    </div>
  );
};
