import { getCanvasOverlayTheme } from "./canvasTheme";

/**
 * Renders the wallpaper boundary marker in world space.
 *
 * Requirements:
 * - Dims everything outside the visible rect using an even-odd fill (large outer rect + inner visible rect).
 * - Dashed border in theme blue (2px on screen) around the visible wallpaper rect.
 * - Label showing "W × H" just above the top-left corner.
 * - Line width, dash sizing, and label font remain constant on screen (divide by zoom).
 * - Adapts to current camera model where world (0, 0) is the top-left of the wallpaper canvas.
 */
export function drawBoundaryMarker(
  ctx: CanvasRenderingContext2D,
  view: { w: number; h: number },
  zoom: number,
): void {
  const safeZoom = Math.max(0.1, zoom);
  const theme = getCanvasOverlayTheme();

  ctx.save();

  // 1. Dim everything outside the visible wallpaper rect using even-odd fill
  ctx.fillStyle = "rgba(14, 26, 31, 0.40)";
  ctx.beginPath();
  const big = 1e5;
  // Large outer rectangle
  ctx.rect(-big, -big, big * 2, big * 2);
  // Inner visible wallpaper viewport rectangle
  ctx.rect(0, 0, view.w, view.h);
  ctx.fill("evenodd");

  // 2. Dashed border (~2px on screen) around the visible wallpaper rectangle in theme blue
  ctx.lineWidth = 2 / safeZoom;
  ctx.setLineDash([8 / safeZoom, 6 / safeZoom]);
  ctx.strokeStyle = theme.blue;
  ctx.strokeRect(0, 0, view.w, view.h);

  // 3. Label showing "W × H" just above the top-left corner
  ctx.setLineDash([]);
  ctx.fillStyle = theme.blue;
  ctx.font = `700 ${12 / safeZoom}px Excalifont, Virgil, sans-serif`;
  ctx.textBaseline = "bottom";

  // Outline/shadow for legibility over any background
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 3 / safeZoom;
  ctx.shadowOffsetY = 1 / safeZoom;

  ctx.fillText(`${Math.round(view.w)} × ${Math.round(view.h)}`, 6 / safeZoom, -6 / safeZoom);

  ctx.restore();
}
