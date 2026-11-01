import rough from "roughjs";
import {
  CanvasElement,
  Point,
  TextElement,
  ImageElement,
} from "../../elements/types";
import { roughOptions } from "../rough-cache";
import { FONT_SIZE_MAP, getFontFamilyString } from "../geometry";
import { useAppStore } from "../../store/useAppStore";
import { getLodTier, getOrLoadAssetBitmap } from "../../lib/assets";

type RoughCanvas = ReturnType<typeof rough.canvas>;

export function drawArrow(
  rc: RoughCanvas,
  el: CanvasElement & { points: Point[] },
): void {
  const pts = el.points;
  if (pts.length < 2) return;
  const opts = roughOptions(el);
  if (pts.length === 2) {
    rc.line(pts[0].x, pts[0].y, pts[1].x, pts[1].y, opts);
  } else {
    rc.linearPath(
      pts.map((p) => [p.x, p.y]),
      opts,
    );
  }
  const pLast = pts[pts.length - 1];
  const pPrev = pts[pts.length - 2];
  const angle = Math.atan2(pLast.y - pPrev.y, pLast.x - pPrev.x);
  const lineLen = Math.hypot(pLast.x - pPrev.y, pLast.y - pPrev.y);
  const headLen = Math.min(
    10 + el.strokeWidth * 3,
    Math.max(lineLen * 0.75, 4),
  );
  const a1 = angle + Math.PI - 0.5;
  const a2 = angle + Math.PI + 0.5;
  rc.line(
    pLast.x,
    pLast.y,
    pLast.x + headLen * Math.cos(a1),
    pLast.y + headLen * Math.sin(a1),
    opts,
  );
  rc.line(
    pLast.x,
    pLast.y,
    pLast.x + headLen * Math.cos(a2),
    pLast.y + headLen * Math.sin(a2),
    opts,
  );
}

export function drawFreedraw(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement & { points: Point[] },
): void {
  const pts = el.points;
  if (pts.length < 1) return;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = el.strokeWidth * 2.2;
  ctx.strokeStyle = el.strokeColor;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 1) {
    ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

export function drawText(ctx: CanvasRenderingContext2D, el: TextElement): void {
  const textStr = typeof el.text === "string" ? el.text : "";
  if (!textStr) return;
  const fontSize = el.fontSize || FONT_SIZE_MAP[el.strokeWidth] || 20;
  ctx.font = `${fontSize}px ${getFontFamilyString(el.fontFamily)}`;
  ctx.fillStyle =
    el.strokeColor || useAppStore.getState().currentStrokeColor || "#ffffff";
  ctx.textBaseline = "top";

  const lines = textStr.split("\n");
  const lineHeight = fontSize * 1.25;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], el.x ?? 0, (el.y ?? 0) + i * lineHeight);
  }
}

export function drawImage(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
  zoom: number = 1,
  onNeedRender?: () => void,
): void {
  const bx = Math.min(el.x, el.x + el.width);
  const by = Math.min(el.y, el.y + el.height);
  const bw = Math.abs(el.width);
  const bh = Math.abs(el.height);

  if (!el.assetId) {
    drawUnavailablePlaceholder(ctx, bx, by, bw, bh);
    return;
  }

  const tier = getLodTier(bw, bh, zoom);
  const result = getOrLoadAssetBitmap(el.assetId, tier, onNeedRender);

  if (result.status === "ready" && result.bitmap) {
    try {
      ctx.drawImage(result.bitmap, el.x, el.y, el.width, el.height);
    } catch {
      drawUnavailablePlaceholder(ctx, bx, by, bw, bh);
    }
    return;
  }

  if (result.status === "loading") {
    drawLoadingHatchPlaceholder(ctx, bx, by, bw, bh);
    return;
  }

  // Not found or decode error
  drawUnavailablePlaceholder(ctx, bx, by, bw, bh);
}

function drawLoadingHatchPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(14, 26, 31, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);

  // Subtle static diagonal hatch pattern (no animation loop)
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(14, 26, 31, 0.12)";
  ctx.lineWidth = 1;
  const step = 20;
  ctx.beginPath();
  for (let i = step; i < w + h; i += step) {
    const x1 = Math.max(x, x + i - h);
    const y1 = Math.min(y + h, y + i);
    const x2 = Math.min(x + w, x + i);
    const y2 = Math.max(y, y + i - w);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.restore();
}

function drawUnavailablePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(14, 26, 31, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);

  // Subtle diagonal cross
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(14, 26, 31, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();

  // Draw clean label if box is large enough
  if (w >= 70 && h >= 28) {
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(14, 26, 31, 0.6)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Image unavailable", x + w / 2, y + h / 2);
  }

  ctx.restore();
}
