import { EyeOff, Pencil, LayoutGrid } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useCanvas } from "./canvas/useCanvas";
import { InlineTextEditor } from "./components/InlineTextEditor";
import { SceneSwitcher } from "./components/SceneSwitcher";
import { StylePanel } from "./components/StylePanel";
import { Toolbar } from "./components/Toolbar";
import { ImageElement, TextElement, ToolType } from "./elements/types";
import { openTextEditor } from "./tools/TextTool";
import { cn, newId, randomSeed, isColorLight } from "./lib/utils";
import { useAppStore } from "./store/useAppStore";
import { useSceneStore } from "./store/useSceneStore";
import { useWidgetStore } from "./store/useWidgetStore";
import { ClockWidget } from "./widgets/ClockWidget";
import { QuickLinks } from "./widgets/QuickLinks";
import { SearchBar } from "./widgets/SearchBar";
import { SettingsDialog } from "./widgets/SettingsDialog";
import { WidgetLayoutOverlay } from "./widgets/WidgetLayoutOverlay";

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvas(canvasRef);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastPasteHandledRef = useRef(0);

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
  const copySelected = useAppStore((s) => s.copySelected);
  const cutSelected = useAppStore((s) => s.cutSelected);
  const pasteClipboard = useAppStore((s) => s.pasteClipboard);
  const deleteSelected = useAppStore((s) => s.deleteSelected);
  const sendBackward = useAppStore((s) => s.sendBackward);
  const sendForward = useAppStore((s) => s.sendForward);
  const groupSelected = useAppStore((s) => s.groupSelected);
  const ungroupSelected = useAppStore((s) => s.ungroupSelected);
  const toggleLockSelected = useAppStore((s) => s.toggleLockSelected);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const setElements = useAppStore((s) => s.setElements);
  const saveToStorage = useAppStore((s) => s.saveToStorage);
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);
  const updateElement = useAppStore((s) => s.updateElement);
  const editingText = useAppStore((s) => s.editingText);
  const setEditingText = useAppStore((s) => s.setEditingText);
  const zoom = useAppStore((s) => s.zoom);
  const scrollOffset = useAppStore((s) => s.scrollOffset);
  const loadScenesFromStorage = useSceneStore((s) => s.loadScenesFromStorage);

  const widgetPositions = useWidgetStore((s) => s.widgetPositions);
  const isLayoutMode = useWidgetStore((s) => s.isLayoutMode);
  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);
  const showClock = useWidgetStore((s) => s.showClock);
  const showSearch = useWidgetStore((s) => s.showSearch);
  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);

  const [isNarrowScreen, setIsNarrowScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCommitText = (newText: string) => {
    const text = newText.trimEnd();
    if (!editingText) return;

    if (editingText.elementId) {
      if (text) {
        pushHistory();
        updateElement(editingText.elementId, { text });
        setSelectedIds([editingText.elementId]);
        saveToStorage();
      } else {
        pushHistory();
        setElements(elements.filter((e) => e.id !== editingText.elementId));
        setSelectedIds([]);
        saveToStorage();
      }
    } else if (text) {
      const el: TextElement = {
        id: newId(),
        type: "text",
        angle: editingText.angle || 0,
        locked: false,
        groupIds: [],
        x: editingText.canvasX,
        y: editingText.canvasY,
        text,
        fontSize: editingText.fontSize,
        fontFamily:
          editingText.fontFamily ||
          useAppStore.getState().currentFontFamily ||
          "handwritten",
        strokeColor: editingText.strokeColor,
        fillColor: "transparent",
        strokeWidth: useAppStore.getState().currentStrokeWidth,
        opacity: useAppStore.getState().currentOpacity,
        seed: randomSeed(),
      };
      pushHistory();
      setElements([...elements, el]);
      setSelectedIds([el.id]);
      saveToStorage();
    }

    setEditingText(null);
    setTool("selection");
  };

  const handleCancelText = () => {
    setEditingText(null);
    setTool("selection");
  };

  // Initialize storage
  useEffect(() => {
    loadScenesFromStorage();
    useWidgetStore.getState().loadFromStorage();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle drawing mode with Space or E if in wallpaper mode
      if (mode === "wallpaper") {
        if (e.key === "e" || e.key === "E") {
          setMode("drawing");
          return;
        }
      }

      if (mode !== "drawing") return;

      // Never trigger canvas shortcuts while typing into text editor
      if (useAppStore.getState().editingText) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.isContentEditable ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      // Enter on single selected text element -> edit it like Excalidraw
      if (e.key === "Enter" && !mod && selectedIds.size === 1) {
        const selectedId = Array.from(selectedIds)[0];
        const selectedEl = elements.find((el) => el.id === selectedId);
        if (selectedEl && selectedEl.type === "text" && !selectedEl.locked) {
          e.preventDefault();
          openTextEditor({ x: selectedEl.x, y: selectedEl.y }, selectedEl as TextElement);
          return;
        }
      }

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (mod && key === "c") {
        if (selectedIds.size > 0) {
          e.preventDefault();
          copySelected();
          return;
        }
      }
      if (mod && key === "x") {
        if (selectedIds.size > 0) {
          e.preventDefault();
          cutSelected();
          return;
        }
      }
      if (mod && key === "v") {
        // Fallback for Ctrl+V in case browser paste event doesn't fire
        setTimeout(() => {
          if (Date.now() - lastPasteHandledRef.current > 50) {
            pasteClipboard();
          }
        }, 40);
      }
      if (mod && key === "a") {
        e.preventDefault();
        const unlocked = elements.filter((el) => !el.locked).map((el) => el.id);
        setSelectedIds(unlocked);
        return;
      }
      if (mod && key === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else {
          groupSelected();
        }
        return;
      }
      if (mod && e.shiftKey && key === "l") {
        e.preventDefault();
        toggleLockSelected();
        return;
      }
      if (mod && key === "]") {
        e.preventDefault();
        sendForward();
        return;
      }
      if (mod && key === "[") {
        e.preventDefault();
        sendBackward();
        return;
      }
      if (e.key === "Escape") {
        setSelectedIds([]);
        return;
      }

      if (key === "h" && !mod) {
        e.preventDefault();
        togglePreview();
        return;
      }

      // Arrow keys nudge
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        selectedIds.size > 0
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;

        pushHistory();
        setElements(
          elements.map((el) => {
            if (!selectedIds.has(el.id) || el.locked) return el;
            if ("points" in el && el.points) {
              return {
                ...el,
                points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              } as any;
            } else if ("x" in el) {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
              };
            }
            return el;
          }),
        );
        saveToStorage();
        return;
      }

      // Tool switching shortcuts
      const toolMap: Record<string, ToolType> = {
        v: "selection",
        r: "rectangle",
        d: "diamond",
        o: "ellipse",
        a: "arrow",
        l: "line",
        p: "freedraw",
        t: "text",
        e: "eraser",
      };
      if (toolMap[key]) {
        setTool(toolMap[key]);
        return;
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.size > 0
      ) {
        deleteSelected();
      }
    };

    // Paste handler for images and copied elements
    const handlePaste = (e: ClipboardEvent) => {
      if (mode !== "drawing") return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.isContentEditable ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      lastPasteHandledRef.current = Date.now();

      // 1. Check if clipboard text contains canvas elements
      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (
            parsed &&
            parsed.type === "canvas-elements" &&
            Array.isArray(parsed.elements) &&
            parsed.elements.length > 0
          ) {
            e.preventDefault();
            pasteClipboard(parsed.elements);
            return;
          }
        } catch {
          // not canvas-elements JSON
        }
      }

      // 2. Check for images in clipboard items
      const items = e.clipboardData?.items;
      let hasImage = false;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            hasImage = true;
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
                  type: "image",
                  angle: 0,
                  locked: false,
                  groupIds: [],
                  x: window.innerWidth / 2 - w / 2,
                  y: window.innerHeight / 2 - h / 2,
                  width: w,
                  height: h,
                  dataUrl,
                  strokeColor: "#1e1e1e",
                  fillColor: "transparent",
                  strokeWidth: 1.5,
                  opacity: 100,
                  seed: randomSeed(),
                };

                pushHistory();
                setElements([...useAppStore.getState().elements, imageEl]);
                setSelectedIds([imageEl.id]);
                setTool("selection");
                saveToStorage();
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }

      // 3. Fallback: if internal store has copied elements, paste them
      if (!hasImage) {
        const state = useAppStore.getState();
        if (state.clipboard && state.clipboard.length > 0) {
          e.preventDefault();
          pasteClipboard();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
    };
  }, [mode, elements, selectedIds]);

  // Background styling with gradient and pattern overlays
  const patternOverlays: Record<string, { image: string; size: string }> = {
    dots: {
      image: "radial-gradient(rgba(255,255,255,0.15) 1.2px, transparent 1.2px)",
      size: "24px 24px",
    },
    grid: {
      image:
        "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
      size: "24px 24px, 24px 24px",
    },
    lines: {
      image: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
      size: "100% 28px",
    },
  };

  const pattern =
    background.pattern && background.pattern !== "none"
      ? patternOverlays[background.pattern]
      : null;
  const baseBg =
    background.type === "image" && background.imageUrl
      ? `url(${background.imageUrl})`
      : undefined;

  const bgStyle: React.CSSProperties = {
    backgroundColor: background.color || "#14141a",
    backgroundImage: pattern
      ? baseBg
        ? `${pattern.image}, ${baseBg}`
        : pattern.image
      : baseBg,
    backgroundSize: pattern
      ? baseBg
        ? `${pattern.size}, cover`
        : pattern.size
      : "cover",
    backgroundPosition: "center",
  };

  const isLight = React.useMemo(() => {
    if (background.type === "image" && background.imageUrl) {
      return false;
    }
    return isColorLight(background.color || "#14141a");
  }, [background.color, background.type, background.imageUrl]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={bgStyle}>
      {/* Interactive / Wallpaper Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full touch-none",
          mode === "wallpaper" || isPreviewing ? "pointer-events-none" : "pointer-events-auto",
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
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {isNarrowScreen ? (
            /* Narrow Viewport Fallback: Centered Stack */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-8">
              <div className="pointer-events-auto flex flex-col items-center gap-6 w-full max-w-xl">
                <ClockWidget isLight={isLight} />
                <SearchBar isLight={isLight} />
                <QuickLinks isLight={isLight} />
              </div>
            </div>
          ) : (
            /* Full-Screen Free-Form Spatial Positioning */
            <>
              {showClock && (
                <div
                  className="absolute pointer-events-auto transition-transform"
                  style={{
                    left: `${widgetPositions.clock.x}%`,
                    top: `${widgetPositions.clock.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <ClockWidget isLight={isLight} />
                </div>
              )}

              {showSearch && (
                <div
                  className="absolute pointer-events-auto w-full max-w-md transition-transform px-4"
                  style={{
                    left: `${widgetPositions.search.x}%`,
                    top: `${widgetPositions.search.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <SearchBar isLight={isLight} />
                </div>
              )}

              {showQuickLinks && (
                <div
                  className="absolute pointer-events-auto max-w-xl transition-transform px-4"
                  style={{
                    left: `${widgetPositions.quickLinks.x}%`,
                    top: `${widgetPositions.quickLinks.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <QuickLinks isLight={isLight} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Full-Screen Interactive Widget Layout Customizer */}
      {isLayoutMode && <WidgetLayoutOverlay isLight={isLight} />}

      {/* Floating Action Micro-Dock (Wallpaper Mode) */}
      {mode === "wallpaper" && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-20 flex items-center p-1 rounded-full backdrop-blur-xl border transition-all duration-200 shadow-2xl",
            isLight
              ? "bg-neutral-900/90 text-white border-neutral-700/60 shadow-black/25"
              : "bg-black/45 text-white border-white/20 shadow-black/40"
          )}
        >
          <button
            title="Widget Layout & Accessories (Drag anywhere on grid)"
            onClick={() => setIsLayoutMode(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 text-white active:scale-95 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <div className={cn("w-px h-4 mx-0.5", isLight ? "bg-white/20" : "bg-white/30")} />
          <button
            title="Customize Wallpaper (Press E or click)"
            onClick={() => setMode("drawing")}
            className="h-9 px-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-white/15 text-white text-xs font-semibold active:scale-95 transition-colors leading-none"
          >
            <Pencil className="w-4 h-4" />
            <span className="leading-none">Draw</span>
          </button>
        </div>
      )}

      {/* Settings Dialog Modal */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Drawing Mode UI Overlays */}
      {mode === "drawing" && !isPreviewing && (
        <>
          <Toolbar />
          <StylePanel />
          <SceneSwitcher />
        </>
      )}

      {/* Floating Preview Pill when UI is hidden */}
      {mode === "drawing" && isPreviewing && (
        <button
          onClick={togglePreview}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/85 hover:bg-neutral-900 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xl active:scale-95 transition-all border border-white/10">
          <EyeOff className="w-3.5 h-3.5" /> Exit Preview (H)
        </button>
      )}
    </div>
  );
};
