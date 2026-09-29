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
import { useAppStore } from "./store/useAppStore";
import { useSceneStore } from "./store/useSceneStore";
import { useWidgetStore } from "./store/useWidgetStore";
import { useWallpaperBackground } from "./hooks/useWallpaperBackground";
import { useTextEditing } from "./hooks/useTextEditing";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useCanvasPaste } from "./hooks/useCanvasPaste";
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

  // Initialize storage
  useEffect(() => {
    loadScenesFromStorage();
    useWidgetStore.getState().loadFromStorage();
  }, [loadScenesFromStorage]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={bgStyle}
    >
      {/* Interactive / Wallpaper Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full touch-none",
          mode === "wallpaper" || isPreviewing
            ? "pointer-events-none"
            : "pointer-events-auto",
        )}
      />

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
      {mode === "wallpaper" && (
        <WallpaperDock
          isLight={isLight}
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
    </div>
  );
};
