import { CanvasElement, Point, TextElement } from "../elements/types";
import { computeSelectionFrame, getBBox, normalizeAngle } from "../canvas/geometry";

/**
 * Flips the selected elements horizontally or vertically around the center of the selection.
 * Handles freedraw paths, lines, arrows, shapes (rectangles, diamonds, ellipses), images, and text.
 */
export function flipElements(
  elements: CanvasElement[],
  selectedIds: Set<string>,
  direction: "horizontal" | "vertical",
): CanvasElement[] {
  const selectedElements = elements.filter(
    (el) => selectedIds.has(el.id) && !el.locked,
  );
  if (selectedElements.length === 0) return elements;

  const frame = computeSelectionFrame(selectedElements);
  if (!frame) return elements;

  const { x: cx, y: cy } = frame.center;
  const isH = direction === "horizontal";

  return elements.map((el) => {
    if (!selectedIds.has(el.id) || el.locked) return el;

    // 1. Path-based elements: freedraw, line, arrow
    if (el.type === "freedraw" || el.type === "line" || el.type === "arrow") {
      const points: Point[] = (el.points || []).map((p) => ({
        x: isH ? 2 * cx - p.x : p.x,
        y: isH ? p.y : 2 * cy - p.y,
      }));
      return {
        ...el,
        points,
      } as CanvasElement;
    }

    // 2. Box-based geometric shapes & images: rectangle, diamond, ellipse, image
    if (
      el.type === "rectangle" ||
      el.type === "diamond" ||
      el.type === "ellipse" ||
      el.type === "image"
    ) {
      const newX = isH ? 2 * cx - (el.x + el.width) : el.x;
      const newY = isH ? el.y : 2 * cy - (el.y + el.height);
      const angle = el.angle ? normalizeAngle(-el.angle) : undefined;
      return {
        ...el,
        x: newX,
        y: newY,
        angle,
      } as CanvasElement;
    }

    // 3. Text elements: compute position from bbox
    if (el.type === "text") {
      const textEl = el as TextElement;
      const bbox = getBBox(textEl);
      const newX = isH ? 2 * cx - (textEl.x + bbox.w) : textEl.x;
      const newY = isH ? textEl.y : 2 * cy - (textEl.y + bbox.h);
      const angle = textEl.angle ? normalizeAngle(-textEl.angle) : undefined;
      return {
        ...textEl,
        x: newX,
        y: newY,
        angle,
      } as CanvasElement;
    }

    return el;
  });
}
