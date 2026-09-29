import { Point, TextElement } from "../../elements/types";
import { rotatePoint, FONT_SIZE_MAP } from "../../canvas/geometry";
import { ResizeState } from "./types";

export function handleResizePointerMove(
  pos: Point,
  state: ResizeState,
  e: PointerEvent,
  updateElement: (id: string, updates: any, shouldSave?: boolean) => void,
): void {
  const { handle, angle, center, origBBox, members } = state;
  const localPos = rotatePoint(pos, center, -angle);

  let newW = origBBox.w;
  let newH = origBBox.h;

  if (e.altKey) {
    // Alt key: symmetric resize from center
    const halfW = Math.abs(localPos.x - center.x);
    const halfH = Math.abs(localPos.y - center.y);

    if (handle.includes("e") || handle.includes("w")) {
      newW = Math.max(4, halfW * 2);
    }
    if (handle.includes("n") || handle.includes("s")) {
      newH = Math.max(4, halfH * 2);
    }

    if (e.shiftKey) {
      const maxScale = Math.max(
        origBBox.w > 0 ? newW / origBBox.w : 1,
        origBBox.h > 0 ? newH / origBBox.h : 1,
      );
      newW = Math.max(4, origBBox.w * maxScale);
      newH = Math.max(4, origBBox.h * maxScale);
    }

    const sx = origBBox.w !== 0 ? newW / origBBox.w : 1;
    const sy = origBBox.h !== 0 ? newH / origBBox.h : 1;

    members.forEach(({ id, snapshot }) => {
      if ("points" in snapshot && snapshot.points) {
        updateElement(
          id,
          {
            points: snapshot.points.map((p) => ({
              x: center.x + (p.x - center.x) * sx,
              y: center.y + (p.y - center.y) * sy,
            })),
          },
          false,
        );
      } else if ("x" in snapshot && "width" in snapshot) {
        const rawW = snapshot.width * sx;
        const rawH = snapshot.height * sy;
        const elemCenterX =
          center.x + (snapshot.x + snapshot.width / 2 - center.x) * sx;
        const elemCenterY =
          center.y + (snapshot.y + snapshot.height / 2 - center.y) * sy;
        updateElement(
          id,
          {
            x: elemCenterX - Math.abs(rawW) / 2,
            y: elemCenterY - Math.abs(rawH) / 2,
            width: Math.abs(rawW),
            height: Math.abs(rawH),
          },
          false,
        );
      } else if (snapshot.type === "text") {
        const textEl = snapshot as TextElement;
        const origFontSize =
          textEl.fontSize || FONT_SIZE_MAP[textEl.strokeWidth] || 20;
        const scale = Math.max(0.2, Math.max(Math.abs(sx), Math.abs(sy)));
        const newFontSize = Math.max(
          8,
          Math.min(240, Math.round(origFontSize * scale)),
        );
        const elemCenterX = center.x + (textEl.x - center.x) * sx;
        const elemCenterY = center.y + (textEl.y - center.y) * sy;
        updateElement(
          id,
          {
            x: elemCenterX,
            y: elemCenterY,
            fontSize: newFontSize,
          },
          false,
        );
      }
    });
    return;
  }

  // Normal resize anchored at opposite edge/corner
  let anchorX = origBBox.x,
    anchorY = origBBox.y;
  if (handle.includes("w")) anchorX = origBBox.x + origBBox.w;
  if (handle.includes("n")) anchorY = origBBox.y + origBBox.h;

  if (handle.includes("e")) newW = localPos.x - anchorX;
  if (handle.includes("w")) newW = anchorX - localPos.x;
  if (handle.includes("s")) newH = localPos.y - anchorY;
  if (handle.includes("n")) newH = anchorY - localPos.y;

  // Shift constraint for proportional aspect ratio
  if (e.shiftKey) {
    const maxScale = Math.max(
      Math.abs(newW / (origBBox.w || 1)),
      Math.abs(newH / (origBBox.h || 1)),
    );
    newW = origBBox.w * maxScale * Math.sign(newW);
    newH = origBBox.h * maxScale * Math.sign(newH);
  }

  if (Math.abs(newW) < 4) newW = 4 * (Math.sign(newW) || 1);
  if (Math.abs(newH) < 4) newH = 4 * (Math.sign(newH) || 1);

  const sx = origBBox.w !== 0 ? newW / origBBox.w : 1;
  const sy = origBBox.h !== 0 ? newH / origBBox.h : 1;

  members.forEach(({ id, snapshot }) => {
    if ("points" in snapshot && snapshot.points) {
      updateElement(
        id,
        {
          points: snapshot.points.map((p) => ({
            x: anchorX + (p.x - anchorX) * sx,
            y: anchorY + (p.y - anchorY) * sy,
          })),
        },
        false,
      );
    } else if ("x" in snapshot && "width" in snapshot) {
      const rawX = anchorX + (snapshot.x - anchorX) * sx;
      const rawY = anchorY + (snapshot.y - anchorY) * sy;
      const rawW = snapshot.width * sx;
      const rawH = snapshot.height * sy;
      updateElement(
        id,
        {
          x: rawW < 0 ? rawX + rawW : rawX,
          y: rawH < 0 ? rawY + rawH : rawY,
          width: Math.abs(rawW),
          height: Math.abs(rawH),
        },
        false,
      );
    } else if (snapshot.type === "text") {
      const textEl = snapshot as TextElement;
      const origFontSize =
        textEl.fontSize || FONT_SIZE_MAP[textEl.strokeWidth] || 20;
      const scale = Math.max(
        0.2,
        handle === "e" || handle === "w"
          ? Math.abs(sx)
          : handle === "n" || handle === "s"
            ? Math.abs(sy)
            : Math.max(Math.abs(sx), Math.abs(sy)),
      );
      const newFontSize = Math.max(
        8,
        Math.min(240, Math.round(origFontSize * scale)),
      );

      const rawX = anchorX + (textEl.x - anchorX) * sx;
      const rawY = anchorY + (textEl.y - anchorY) * sy;

      updateElement(
        id,
        {
          x: rawX,
          y: rawY,
          fontSize: newFontSize,
        },
        false,
      );
    }
  });
}
