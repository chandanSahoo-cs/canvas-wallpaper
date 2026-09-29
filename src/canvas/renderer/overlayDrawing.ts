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

export function drawRoundedRect(
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

export function drawLockMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.save();
  // Circular badge with subtle shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Padlock shackle
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 3.2, y - 1);
  ctx.lineTo(x - 3.2, y - 4);
  ctx.arc(x, y - 4, 3.2, Math.PI, 0);
  ctx.lineTo(x + 3.2, y - 1);
  ctx.stroke();

  // Padlock body
  ctx.fillStyle = "#475569";
  drawRoundedRect(ctx, x - 5, y - 1, 10, 7.5, 1.5);
  ctx.fill();

  // Keyhole dot & slit
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y + 2, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x, y + 4.2);
  ctx.stroke();

  ctx.restore();
}

export function drawGroupMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.save();
  // Circular badge with subtle shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Group icon: two overlapping squares
  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 1.2;
  drawRoundedRect(ctx, x - 5.5, y - 5.5, 7, 7, 1);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 1.2;
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

export function drawRotationBadge(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  deg: number,
  frameCenter?: Point,
): void {
  const text = `${deg}°`;
  ctx.save();
  ctx.font =
    '600 11px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textWidth = ctx.measureText(text).width;
  const paddingX = 8;
  const badgeW = Math.max(textWidth + paddingX * 2, 34);
  const badgeH = 20;
  const r = 5;

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

  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#18181b";
  drawRoundedRect(ctx, x, y, badgeW, badgeH, r);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 1.2;
  drawRoundedRect(ctx, x, y, badgeW, badgeH, r);
  ctx.stroke();

  ctx.fillStyle = "#f4f4f5";
  ctx.fillText(text, bx, by);

  ctx.restore();
}

export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  marquee: { start: Point; current: Point },
): void {
  const x0 = Math.min(marquee.start.x, marquee.current.x);
  const y0 = Math.min(marquee.start.y, marquee.current.y);
  const w = Math.abs(marquee.current.x - marquee.start.x);
  const h = Math.abs(marquee.current.y - marquee.start.y);

  ctx.save();
  ctx.fillStyle = "rgba(105, 101, 219, 0.08)";
  ctx.strokeStyle = "#6965db";
  ctx.lineWidth = 1;
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
        ? "rgba(155, 155, 163, 0.7)"
        : "rgba(105, 101, 219, 0.5)";
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
        ctx.strokeStyle = "rgba(99, 102, 241, 0.6)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.lineTo(midPt.x, midPt.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#6366f1";
      ctx.strokeStyle = "#ffffff";
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

  ctx.strokeStyle = allLocked ? "#9b9ba3" : "#6965db";
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

    // 8 Resize handle dots
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
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 1.5;
    for (const [hx, hy] of handlePts) {
      ctx.beginPath();
      ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Rotation circle handle
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
