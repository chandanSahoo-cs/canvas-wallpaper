import { CanvasElement } from "../elements/types";
import { getBBox } from "../canvas/geometry";

export type ArrangeLayout = "grid" | "masonry" | "row" | "column";

function shiftElement(el: CanvasElement, dx: number, dy: number): CanvasElement {
  if (dx === 0 && dy === 0) return el;

  switch (el.type) {
    case "rectangle":
    case "diamond":
    case "ellipse":
    case "image":
    case "text":
      return {
        ...el,
        x: el.x + dx,
        y: el.y + dy,
      };
    case "line":
    case "arrow":
    case "freedraw":
      return {
        ...el,
        points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
    default:
      return el;
  }
}

export function autoArrangeElements(
  elements: CanvasElement[],
  selectedIds: Set<string>,
  layout: ArrangeLayout,
  spacing: number = 20,
): CanvasElement[] {
  // Only arrange unlocked selected elements
  const targetElements = elements.filter(
    (el) => selectedIds.has(el.id) && !el.locked,
  );

  if (targetElements.length < 2) {
    return elements;
  }

  // Calculate bounding boxes for all targets
  const items = targetElements.map((el) => ({
    el,
    box: getBBox(el),
  }));

  // Preserve natural reading order (Y primary, X secondary)
  items.sort((a, b) => {
    const dy = a.box.y - b.box.y;
    if (Math.abs(dy) > 20) return dy;
    return a.box.x - b.box.x;
  });

  const originX = Math.min(...items.map((it) => it.box.x));
  const originY = Math.min(...items.map((it) => it.box.y));

  const shifts = new Map<string, { dx: number; dy: number }>();

  switch (layout) {
    case "row": {
      let curX = originX;
      for (const item of items) {
        const dx = curX - item.box.x;
        const dy = originY - item.box.y;
        shifts.set(item.el.id, { dx, dy });
        curX += item.box.w + spacing;
      }
      break;
    }

    case "column": {
      let curY = originY;
      for (const item of items) {
        const dx = originX - item.box.x;
        const dy = curY - item.box.y;
        shifts.set(item.el.id, { dx, dy });
        curY += item.box.h + spacing;
      }
      break;
    }

    case "grid": {
      const cols = Math.max(1, Math.ceil(Math.sqrt(items.length)));
      const rows = Math.ceil(items.length / cols);

      // Calculate maximum width per column and maximum height per row
      const colWidths = new Array(cols).fill(0);
      const rowHeights = new Array(rows).fill(0);

      items.forEach((item, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        colWidths[c] = Math.max(colWidths[c], item.box.w);
        rowHeights[r] = Math.max(rowHeights[r], item.box.h);
      });

      // Calculate column start X positions and row start Y positions
      const colX = [originX];
      for (let c = 1; c < cols; c++) {
        colX[c] = colX[c - 1] + colWidths[c - 1] + spacing;
      }

      const rowY = [originY];
      for (let r = 1; r < rows; r++) {
        rowY[r] = rowY[r - 1] + rowHeights[r - 1] + spacing;
      }

      items.forEach((item, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const targetX = colX[c];
        const targetY = rowY[r];
        shifts.set(item.el.id, {
          dx: targetX - item.box.x,
          dy: targetY - item.box.y,
        });
      });
      break;
    }

    case "masonry": {
      const cols = Math.max(2, Math.ceil(Math.sqrt(items.length)));
      const maxColWidth = Math.max(...items.map((it) => it.box.w));
      const colHeights = new Array(cols).fill(originY);

      for (const item of items) {
        // Find column with smallest current height
        let bestCol = 0;
        let minHeight = colHeights[0];
        for (let c = 1; c < cols; c++) {
          if (colHeights[c] < minHeight) {
            minHeight = colHeights[c];
            bestCol = c;
          }
        }

        const targetX = originX + bestCol * (maxColWidth + spacing);
        const targetY = colHeights[bestCol];

        shifts.set(item.el.id, {
          dx: targetX - item.box.x,
          dy: targetY - item.box.y,
        });

        colHeights[bestCol] += item.box.h + spacing;
      }
      break;
    }
  }

  return elements.map((el) => {
    const shift = shifts.get(el.id);
    if (!shift) return el;
    return shiftElement(el, shift.dx, shift.dy);
  });
}
