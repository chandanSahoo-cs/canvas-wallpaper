import { Point } from "../elements/types";

export const BASE_CANVAS_WIDTH = 1920;
export const BASE_CANVAS_HEIGHT = 1080;

export interface ViewportTransform {
  baseScale: number;
  effectiveZoom: number;
  originX: number;
  originY: number;
  maxScrollX: number;
  maxScrollY: number;
}

/**
 * Computes coordinate transformation metrics for the canvas.
 * In "viewport" mode:
 * - Reference canvas is 1920 x 1080 (16:9 standard wallpaper).
 * - Canvas is auto-fitted and centered on the current screen resolution.
 * - Zooming magnifies details into the screen; pan is clamped strictly inside the 1920x1080 frame.
 * In "infinite" mode:
 * - Unbounded virtual 2D plane; unconstrained pan & zoom.
 */
export function computeViewportTransform(
  winW: number,
  winH: number,
  zoom: number,
  canvasMode: "viewport" | "infinite" = "viewport",
): ViewportTransform {
  if (canvasMode === "infinite") {
    return {
      baseScale: 1,
      effectiveZoom: zoom,
      originX: 0,
      originY: 0,
      maxScrollX: Infinity,
      maxScrollY: Infinity,
    };
  }

  const baseScale = Math.min(
    winW / BASE_CANVAS_WIDTH,
    winH / BASE_CANVAS_HEIGHT,
  );
  const effectiveZoom = baseScale * zoom;
  const renderedW = BASE_CANVAS_WIDTH * effectiveZoom;
  const renderedH = BASE_CANVAS_HEIGHT * effectiveZoom;

  const originX = renderedW <= winW ? (winW - renderedW) / 2 : 0;
  const originY = renderedH <= winH ? (winH - renderedH) / 2 : 0;

  const maxScrollX =
    renderedW > winW
      ? Math.max(0, BASE_CANVAS_WIDTH - winW / effectiveZoom)
      : 0;
  const maxScrollY =
    renderedH > winH
      ? Math.max(0, BASE_CANVAS_HEIGHT - winH / effectiveZoom)
      : 0;

  return {
    baseScale,
    effectiveZoom,
    originX,
    originY,
    maxScrollX,
    maxScrollY,
  };
}

export function screenToCanvas(
  screenPos: Point,
  transform: ViewportTransform,
  scrollOffset: Point,
): Point {
  return {
    x:
      (screenPos.x - transform.originX) / transform.effectiveZoom +
      scrollOffset.x,
    y:
      (screenPos.y - transform.originY) / transform.effectiveZoom +
      scrollOffset.y,
  };
}

export function canvasToScreen(
  canvasPos: Point,
  transform: ViewportTransform,
  scrollOffset: Point,
): Point {
  return {
    x:
      transform.originX +
      (canvasPos.x - scrollOffset.x) * transform.effectiveZoom,
    y:
      transform.originY +
      (canvasPos.y - scrollOffset.y) * transform.effectiveZoom,
  };
}

export function clampScrollOffset(
  offset: Point,
  transform: ViewportTransform,
): Point {
  if (
    transform.maxScrollX === Infinity ||
    transform.maxScrollY === Infinity
  ) {
    return offset;
  }
  return {
    x: Math.max(0, Math.min(transform.maxScrollX, offset.x)),
    y: Math.max(0, Math.min(transform.maxScrollY, offset.y)),
  };
}
