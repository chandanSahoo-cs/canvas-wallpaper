import { useEffect, useRef } from "react";
import { Point, TextElement, ToolType } from "../elements/types";
import { useAppStore } from "../store/useAppStore";
import { EraserTool } from "../tools/EraserTool";
import { FreedrawTool } from "../tools/FreedrawTool";
import { LineTool } from "../tools/LineTool";
import { SelectionTool } from "../tools/SelectionTool";
import { ShapeTool } from "../tools/ShapeTool";
import { TextTool, openTextEditor } from "../tools/TextTool";
import { CanvasRenderer } from "./CanvasRenderer";
import { elementContains, getCenter, rotatePoint } from "./geometry";
import {
  computeViewportTransform,
  screenToCanvas as viewportScreenToCanvas,
  clampScrollOffset,
  ViewportTransform,
} from "./viewport";

export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const toolsRef = useRef<Record<ToolType, Tool> | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const panOriginOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    const selectionTool = new SelectionTool();
    const tools: Record<ToolType, Tool> = {
      selection: selectionTool,
      rectangle: new ShapeTool("rectangle"),
      diamond: new ShapeTool("diamond"),
      ellipse: new ShapeTool("ellipse"),
      arrow: new LineTool("arrow"),
      line: new LineTool("line"),
      freedraw: new FreedrawTool(),
      text: new TextTool(),
      eraser: new EraserTool(),
    };
    toolsRef.current = tools;

    // Viewport transform helper
    function getTransform(state = useAppStore.getState()): ViewportTransform {
      const rect = canvas!.getBoundingClientRect();
      const isCleanView = state.mode === "wallpaper" || state.isPreviewing;
      return computeViewportTransform(
        rect.width,
        rect.height,
        isCleanView ? 1 : state.zoom,
        state.canvasMode,
      );
    }

    // Handle canvas sizing
    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
      const state = useAppStore.getState();
      const transform = getTransform(state);
      state.setScrollOffset((prev) => clampScrollOffset(prev, transform));
      triggerRender();
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Render loop helper
    function triggerRender() {
      const state = useAppStore.getState();
      const isCleanView = state.mode === "wallpaper" || state.isPreviewing;
      renderer.render({
        elements: state.elements,
        draft: isCleanView ? null : state.draft,
        selectedIds: isCleanView ? new Set() : state.selectedIds,
        zoom: isCleanView ? 1 : state.zoom,
        scrollOffset: isCleanView ? { x: 0, y: 0 } : state.scrollOffset,
        canvasMode: state.canvasMode,
        isCleanView,
        marquee: isCleanView ? null : selectionTool.marqueeState,
        rotationOverlay: isCleanView
          ? null
          : selectionTool.getRotationOverlay(),
      });
    }

    // Subscribe to Zustand state changes to trigger re-renders
    const unsubscribe = useAppStore.subscribe(() => {
      triggerRender();
    });

    renderer.onNeedRender = () => {
      triggerRender();
    };

    // Helper: Screen to canvas coordinates (accounting for viewport auto-fit, zoom, and scroll offset)
    function screenToCanvas(screenX: number, screenY: number): Point {
      const rect = canvas!.getBoundingClientRect();
      const state = useAppStore.getState();
      const transform = getTransform(state);
      const isCleanView = state.mode === "wallpaper" || state.isPreviewing;
      return viewportScreenToCanvas(
        { x: screenX - rect.left, y: screenY - rect.top },
        transform,
        isCleanView ? { x: 0, y: 0 } : state.scrollOffset,
      );
    }

    // Pointer events
    const onPointerDown = (e: PointerEvent) => {
      const state = useAppStore.getState();
      if (state.mode !== "drawing" || state.isPreviewing) return;

      // Space + Drag or Middle mouse button -> Panning
      if (isSpacePressedRef.current || e.button === 1) {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panOriginOffsetRef.current = { ...state.scrollOffset };
        canvas!.setPointerCapture(e.pointerId);
        return;
      }

      if (e.button !== 0) return; // Only primary button for drawing/tools

      // If text editor is currently active, clicking canvas commits it via onBlur
      if (state.editingText) {
        return;
      }

      const rawPos = { x: e.clientX, y: e.clientY };
      const pos = screenToCanvas(e.clientX, e.clientY);
      const tool = tools[state.currentTool];
      if (tool) {
        tool.onPointerDown({ pos, rawPos, e, canvas: canvas! });
        triggerRender();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = useAppStore.getState();
      if (state.mode !== "drawing" || state.isPreviewing) return;

      if (isPanningRef.current) {
        const transform = getTransform(state);
        const dx =
          (e.clientX - panStartRef.current.x) / transform.effectiveZoom;
        const dy =
          (e.clientY - panStartRef.current.y) / transform.effectiveZoom;
        const rawOffset = {
          x: panOriginOffsetRef.current.x - dx,
          y: panOriginOffsetRef.current.y - dy,
        };
        state.setScrollOffset(clampScrollOffset(rawOffset, transform));
        return;
      }

      const rawPos = { x: e.clientX, y: e.clientY };
      const pos = screenToCanvas(e.clientX, e.clientY);
      const tool = tools[state.currentTool];
      if (tool) {
        tool.onPointerMove({ pos, rawPos, e, canvas: canvas! });
        if (tool.getCursor) {
          canvas!.style.cursor = tool.getCursor(pos);
        }
        triggerRender();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        canvas!.releasePointerCapture(e.pointerId);
      } catch {}
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }
      const state = useAppStore.getState();
      if (state.mode !== "drawing" || state.isPreviewing) return;

      const rawPos = { x: e.clientX, y: e.clientY };
      const pos = screenToCanvas(e.clientX, e.clientY);
      const tool = tools[state.currentTool];
      if (tool) {
        tool.onPointerUp({ pos, rawPos, e, canvas: canvas! });
        triggerRender();
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      try {
        canvas!.releasePointerCapture(e.pointerId);
      } catch {}
      isPanningRef.current = false;
      const state = useAppStore.getState();
      if (state.mode !== "drawing" || state.isPreviewing) return;
      const rawPos = { x: e.clientX, y: e.clientY };
      const pos = screenToCanvas(e.clientX, e.clientY);
      const tool = tools[state.currentTool];
      if (tool && tool.onPointerCancel) {
        tool.onPointerCancel({ pos, rawPos, e, canvas: canvas! });
        triggerRender();
      }
    };

    // Double-click to edit existing text, add text into shapes, or start typing anywhere like Excalidraw
    const onDoubleClick = (e: MouseEvent) => {
      const state = useAppStore.getState();
      if (state.mode !== "drawing" || state.isPreviewing) return;

      const pos = screenToCanvas(e.clientX, e.clientY);
      // Hit test elements top-to-bottom
      for (let i = state.elements.length - 1; i >= 0; i--) {
        const el = state.elements[i];
        const local = el.angle
          ? rotatePoint(pos, getCenter(el), -el.angle)
          : pos;
        if (elementContains(el, local)) {
          if (el.type === "text") {
            openTextEditor({ x: el.x, y: el.y }, el as TextElement);
            return;
          }
          if (
            el.type === "rectangle" ||
            el.type === "diamond" ||
            el.type === "ellipse"
          ) {
            const center = getCenter(el);
            openTextEditor({ x: center.x - 24, y: center.y - 12 });
            return;
          }
        }
      }

      // Double-click on blank canvas starts typing at that location
      openTextEditor(pos);
    };

    // Wheel event for zoom with Ctrl or touchpad pinch, and 2-finger panning
    const onWheel = (e: WheelEvent) => {
      const state = useAppStore.getState();
      if (state.mode !== "drawing" || state.isPreviewing) return;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const rect = canvas!.getBoundingClientRect();
        const mouseScreenPos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        const currentZoom = state.zoom;
        const minZ = state.canvasMode === "viewport" ? 1.0 : 0.5;
        const newZoom = Math.max(minZ, Math.min(5.0, currentZoom * factor));

        const currentTransform = getTransform(state);
        // Find canvas point currently under the mouse cursor
        const mouseCanvas = viewportScreenToCanvas(
          mouseScreenPos,
          currentTransform,
          state.scrollOffset,
        );

        const newTransform = computeViewportTransform(
          rect.width,
          rect.height,
          newZoom,
          state.canvasMode,
        );

        // Keep the canvas point anchored directly under the mouse cursor
        const newScrollOffset: Point = {
          x:
            mouseCanvas.x -
            (mouseScreenPos.x - newTransform.originX) /
              newTransform.effectiveZoom,
          y:
            mouseCanvas.y -
            (mouseScreenPos.y - newTransform.originY) /
              newTransform.effectiveZoom,
        };

        state.setZoom(newZoom);
        state.setScrollOffset(
          clampScrollOffset(newScrollOffset, newTransform),
        );
      } else if (e.shiftKey) {
        // Pan horizontally
        e.preventDefault();
        const transform = getTransform(state);
        const delta = (e.deltaX || e.deltaY) / transform.effectiveZoom;
        const rawOffset = {
          x: state.scrollOffset.x + delta,
          y: state.scrollOffset.y,
        };
        state.setScrollOffset(clampScrollOffset(rawOffset, transform));
      } else {
        // Default 2-finger trackpad or mouse wheel pan
        e.preventDefault();
        const transform = getTransform(state);
        const dx = (e.deltaX || 0) / transform.effectiveZoom;
        const dy = (e.deltaY || 0) / transform.effectiveZoom;
        const rawOffset = {
          x: state.scrollOffset.x + dx,
          y: state.scrollOffset.y + dy,
        };
        state.setScrollOffset(clampScrollOffset(rawOffset, transform));
      }
    };

    // Keyboard handlers for spacebar pan and shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        e.code === "Space" &&
        !e.repeat &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "INPUT" &&
        target?.tagName !== "TEXTAREA" &&
        target?.tagName !== "INPUT"
      ) {
        isSpacePressedRef.current = true;
        canvas!.style.cursor = "grab";
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = false;
        canvas!.style.cursor = "default";
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("dblclick", onDoubleClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Initial render and robust font load trigger
    triggerRender();

    let fontInterval: ReturnType<typeof setInterval> | null = null;
    const onFontsLoaded = () => {
      triggerRender();
    };

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.addEventListener("loadingdone", onFontsLoaded);

      Promise.all([
        document.fonts.load("20px Excalifont"),
        document.fonts.load("20px Virgil"),
        document.fonts.ready,
      ])
        .then(onFontsLoaded)
        .catch(() => {
          triggerRender();
        });

      // Poll briefly to ensure canvas redraws as soon as Excalifont is verified ready
      let attempts = 0;
      fontInterval = setInterval(() => {
        attempts++;
        if (document.fonts.check("20px Excalifont") || attempts >= 15) {
          if (fontInterval) clearInterval(fontInterval);
          fontInterval = null;
          triggerRender();
        }
      }, 100);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("dblclick", onDoubleClick);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.removeEventListener("loadingdone", onFontsLoaded);
      }
      if (fontInterval) {
        clearInterval(fontInterval);
      }
      unsubscribe();
    };
  }, [canvasRef]);
}
