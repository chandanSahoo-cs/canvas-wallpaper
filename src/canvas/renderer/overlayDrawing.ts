import { CanvasElement, Point } from "../../elements/types";
import {
  getBBox,
  getCenter,
  rotatePoint,
  computeSelectionFrame,
  getHandlePositions,
  ROTATE_HANDLE_OFFSET,
  RotationOverlay,
  angleToDegrees,
} from "../geometry";
import { useAppStore } from "../../store/useAppStore";
import { getCanvasOverlayTheme } from "./canvasTheme";

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function drawLockMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const theme = getCanvasOverlayTheme();
  ctx.save();
  // Badge with border
  ctx.fillStyle = theme.surface;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Padlock shackle
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 3.2, y - 1);
  ctx.lineTo(x - 3.2, y - 4);
  ctx.arc(x, y - 4, 3.2, Math.PI, 0);
  ctx.lineTo(x + 3.2, y - 1);
  ctx.stroke();

  // Padlock body
  ctx.fillStyle = theme.warning;
  drawRoundedRect(ctx, x - 5, y - 1, 10, 7.5, 1.5);
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Keyhole
  ctx.fillStyle = theme.onAccent;
  ctx.beginPath();
  ctx.arc(x, y + 2, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = theme.onAccent;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x, y + 4.2);
  ctx.stroke();

  ctx.restore();
}

function drawGroupMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const theme = getCanvasOverlayTheme();
  ctx.save();
  ctx.fillStyle = theme.surface;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = theme.blue;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Group icon: two overlapping squares in theme blue
  ctx.strokeStyle = theme.blue;
  ctx.lineWidth = 1.4;
  drawRoundedRect(ctx, x - 5.5, y - 5.5, 7, 7, 1);
  ctx.stroke();

  ctx.fillStyle = theme.surface;
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.4;
  drawRoundedRect(ctx, x - 1.5, y - 1.5, 7, 7, 1);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawLockBadge(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
): void {
  const b = getBBox(el);
  const center = getCenter(el);
  const tr = rotatePoint(
    { x: b.x + b.w + 4, y: b.y - 12 },
    center,
    el.angle || 0,
  );
  drawLockMarker(ctx, tr.x, tr.y);
}

function drawRotationBadge(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  deg: number,
  frameCenter?: Point,
): void {
  const theme = getCanvasOverlayTheme();
  const text = `${deg}°`;
  ctx.save();
  ctx.font = '700 11px Excalifont, Virgil, cursive, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textWidth = ctx.measureText(text).width;
  const paddingX = 8;
  const badgeW = Math.max(textWidth + paddingX * 2, 34);
  const badgeH = 20;
  const r = 4;

  let bx = pos.x;
  let by = pos.y;
  if (frameCenter) {
    const dx = pos.x - frameCenter.x;
    const dy = pos.y - frameCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.001) {
      bx += (dx / dist) * 22;
      by += (dy / dist) * 22;
    } else {
      by -= 22;
    }
  } else {
    by -= 22;
  }

  const x = bx - badgeW / 2;
  const y = by - badgeH / 2;

  // Background and border
  ctx.fillStyle = theme.surface;
  drawRoundedRect(ctx, x, y, badgeW, badgeH, r);
  ctx.fill();

  ctx.strokeStyle = theme.blue;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, x, y, badgeW, badgeH, r);
  ctx.stroke();

  ctx.fillStyle = theme.ink;
  ctx.fillText(text, bx, by);

  ctx.restore();
}

export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  marquee: { start: Point; current: Point },
): void {
  const theme = getCanvasOverlayTheme();
  const x0 = Math.min(marquee.start.x, marquee.current.x);
  const y0 = Math.min(marquee.start.y, marquee.current.y);
  const w = Math.abs(marquee.current.x - marquee.start.x);
  const h = Math.abs(marquee.current.y - marquee.start.y);

  ctx.save();
  ctx.fillStyle = "rgba(70, 186, 235, 0.12)";
  ctx.strokeStyle = theme.blue;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeRect(x0, y0, w, h);
  ctx.restore();
}

export function drawSelectionOverlays(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  selectedIds: Set<string>,
  rotationOverlay?: RotationOverlay | null,
): void {
  const theme = getCanvasOverlayTheme();
  const editingText = useAppStore.getState().editingText;
  const selectedMembers = elements.filter(
    (el) =>
      selectedIds.has(el.id) &&
      (!editingText || el.id !== editingText.elementId),
  );
  if (selectedMembers.length === 0) return;

  const anyLocked = selectedMembers.some((el) => el.locked);
  const allLocked = selectedMembers.every((el) => el.locked);
  const hasGroup = selectedMembers.some(
    (el) => el.groupIds && el.groupIds.length > 0,
  );
  const isGrouped =
    hasGroup &&
    (selectedMembers.length > 1 ||
      (selectedMembers[0]?.groupIds && selectedMembers[0].groupIds.length > 0));

  // Draw item outlines for ungrouped multi-selection
  if (selectedMembers.length > 1 && !isGrouped) {
    for (const el of selectedMembers) {
      const b = getBBox(el);
      ctx.save();
      if (el.angle) {
        const center = getCenter(el);
        ctx.translate(center.x, center.y);
        ctx.rotate(el.angle);
        ctx.translate(-center.x, -center.y);
      }
      ctx.strokeStyle = el.locked
        ? theme.muted
        : theme.blue;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
      ctx.restore();
    }
  }

  const frame =
    rotationOverlay && rotationOverlay.frame
      ? rotationOverlay.frame
      : computeSelectionFrame(selectedMembers);
  if (!frame) return;

  // Single unlocked line or arrow selected
  if (frame.isLine && frame.lineElement && !allLocked) {
    const handles = getHandlePositions(frame);
    const startPt = handles["line-start"];
    const midPt = handles["line-mid"];
    const endPt = handles["line-end"];

    if (startPt && endPt) {
      ctx.save();

      if (frame.lineElement.points.length > 2) {
        ctx.strokeStyle = theme.blue;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.lineTo(midPt.x, midPt.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = theme.surface;
      ctx.strokeStyle = theme.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.blue;
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(midPt.x, midPt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      if (isGrouped) {
        const b = frame.bbox;
        drawGroupMarker(ctx, b.x - 4, b.y - 14);
      }
      return;
    }
  }

  const b = frame.bbox;
  const PAD = 8;
  const x0 = b.x - PAD,
    y0 = b.y - PAD,
    x1 = b.x + b.w + PAD,
    y1 = b.y + b.h + PAD;
  const midX = (x0 + x1) / 2,
    midY = (y0 + y1) / 2;

  ctx.save();
  ctx.translate(frame.center.x, frame.center.y);
  ctx.rotate(frame.angle);
  ctx.translate(-frame.center.x, -frame.center.y);

  ctx.strokeStyle = allLocked ? theme.muted : theme.blue;
  ctx.lineWidth = 1.5;
  if (allLocked) {
    ctx.setLineDash([4, 4]);
  } else if (isGrouped) {
    ctx.setLineDash([5, 5]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.setLineDash([]);

  if (!allLocked) {
    // Rotation stalk line
    ctx.beginPath();
    ctx.moveTo(midX, y0);
    ctx.lineTo(midX, y0 - ROTATE_HANDLE_OFFSET);
    ctx.stroke();

    // 8 Resize handle dots: surface fill with blue border
    const handlePts = [
      [x0, y0],
      [midX, y0],
      [x1, y0],
      [x1, midY],
      [x1, y1],
      [midX, y1],
      [x0, y1],
      [x0, midY],
    ];
    ctx.fillStyle = theme.surface;
    ctx.strokeStyle = theme.blue;
    ctx.lineWidth = 1.5;
    for (const [hx, hy] of handlePts) {
      ctx.beginPath();
      ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Rotation circle handle: surface fill with blue border
    ctx.beginPath();
    ctx.arc(midX, y0 - ROTATE_HANDLE_OFFSET, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  const narrow = x1 - x0 < 45;
  const lockOffset = narrow && isGrouped ? 8 : 0;
  const groupOffset = narrow && (allLocked || anyLocked) ? -8 : 0;

  const topRight = rotatePoint(
    { x: x1 + lockOffset, y: y0 - 14 },
    frame.center,
    frame.angle,
  );
  const topLeft = rotatePoint(
    { x: x0 + groupOffset, y: y0 - 14 },
    frame.center,
    frame.angle,
  );

  if (allLocked || anyLocked) {
    drawLockMarker(ctx, topRight.x, topRight.y);
  }
  if (isGrouped) {
    drawGroupMarker(ctx, topLeft.x, topLeft.y);
  }

  if (!allLocked) {
    if (
      rotationOverlay &&
      typeof rotationOverlay.degrees === "number" &&
      rotationOverlay.handlePos
    ) {
      drawRotationBadge(
        ctx,
        rotationOverlay.handlePos,
        rotationOverlay.degrees,
        frame.center,
      );
    } else if (frame.angle && Math.abs(frame.angle) > 0.001) {
      const deg = angleToDegrees(frame.angle);
      if (deg !== 0) {
        const handles = getHandlePositions(frame);
        if (handles.rotate) {
          drawRotationBadge(ctx, handles.rotate, deg, frame.center);
        }
      }
    }
  }
}
