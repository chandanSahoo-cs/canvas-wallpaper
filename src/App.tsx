import { requestStoragePersistence, runAssetGarbageCollection, backfillManager } from "./lib/assets";
import { BackfillProgressIndicator } from "./components/ui/BackfillProgressIndicator";
import { StorageErrorBanner } from "./components/ui/StorageErrorBanner";
import { collectReferencedAssetIds } from "./lib/assets/references";
import { getInboxItemsOrThrow } from "./lib/inbox/storage";
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
import { TourHintPill } from "./components/TourHintPill";
import { WebCapturePromptToast } from "./components/WebCapturePromptToast";
import { PresetGalleryDialog } from "./components/PresetGalleryDialog";
import { LibraryModal } from "./components/library/LibraryModal";
import { LightboxModal } from "./components/lightbox/LightboxModal";
import { BackupModal } from "./components/backup/BackupModal";
import { BackupNudgeBanner } from "./components/backup/BackupNudgeBanner";
import { InboxTray } from "./components/inbox/InboxTray";
import { useAppStore } from "./store/useAppStore";
import { useSceneStore } from "./store/useSceneStore";
import { useWidgetStore } from "./store/useWidgetStore";
import { useWallpaperBackground } from "./hooks/useWallpaperBackground";
import { useTextEditing } from "./hooks/useTextEditing";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useCanvasPaste } from "./hooks/useCanvasPaste";
import { useCanvasDrop } from "./hooks/useCanvasDrop";
import { Image as ImageIcon, ExternalLink } from "lucide-react";
import { useViewportRecorder } from "./hooks/useViewportRecorder";
import { useViewportBoundary } from "./hooks/useViewportBoundary";
import { useOnboardingStore } from "./store/useOnboardingStore";
import { cn } from "./lib/utils";

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvas(canvasRef);

  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useAppStore((s) => s.setIsSettingsOpen);
  const isShortcutsOpen = useAppStore((s) => s.isShortcutsOpen);
  const setIsShortcutsOpen = useAppStore((s) => s.setIsShortcutsOpen);
  const isBackupOpen = useAppStore((s) => s.isBackupOpen);
  const setIsBackupOpen = useAppStore((s) => s.setIsBackupOpen);



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
  const isTourActive = useOnboardingStore((s) => s.isTourActive);
  const loadScenesFromStorage = useSceneStore((s) => s.loadScenesFromStorage);
  const scenes = useSceneStore((s) => s.scenes);

  const isLayoutMode = useWidgetStore((s) => s.isLayoutMode);
  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);

  // Modular custom hooks for separated concerns
  const { bgStyle, isLight } = useWallpaperBackground(background);
  const { editingText, handleCommitText, handleCancelText } = useTextEditing();
  useKeyboardShortcuts({
    onToggleShortcuts: () => setIsShortcutsOpen(!useAppStore.getState().isShortcutsOpen),
  });
  useCanvasPaste();
  const { isDraggingOver } = useCanvasDrop({ canvasRef });
  useViewportRecorder(mode);
  useViewportBoundary();

  // Initialize storage
  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        await loadScenesFromStorage();
        useResurfaceStore.getState().syncFromScenes(useSceneStore.getState().scenes);
      } catch (err) {
        console.warn("loadScenesFromStorage error:", err);
      }

      useWidgetStore.getState().loadFromStorage();
      requestStoragePersistence();

      // Startup garbage collection: collect all referenced asset IDs across all scenes and inbox
      setTimeout(async () => {
        if (isCancelled) return;
        try {
          const loadStatus = useSceneStore.getState().loadStatus;
          if (loadStatus !== "ok") {
            console.warn(`Startup GC skipped: scene loadStatus is '${loadStatus}'`);
            return;
          }

          const inboxItems = await getInboxItemsOrThrow();
          const allScenes = useSceneStore.getState().scenes;
          const referenced = collectReferencedAssetIds(allScenes, inboxItems);

          await runAssetGarbageCollection(referenced);
          await backfillManager.scanAndStart();
        } catch (gcErr) {
          console.warn("Startup GC skipped due to error reading references:", gcErr);
        }
      }, 2000);
    })();

    return () => {
      isCancelled = true;
    };
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
          mode === "wallpaper" || isPreviewing || isTourActive
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
      <TourHintPill />
      <WebCapturePromptToast />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      {/* Non-Annoying Backup Reminder Banner */}
      <BackupNudgeBanner onOpenBackup={() => setIsBackupOpen(true)} />

      {/* Idle Metadata Backfill Progress */} 
      <StorageErrorBanner />
      <BackfillProgressIndicator />
    </div>
  );
};
