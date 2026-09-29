import { Point } from "../../elements/types";
import { LineHandleState } from "./types";

export function handleLineHandlePointerMove(
  pos: Point,
  state: LineHandleState,
  e: PointerEvent,
  updateElement: (id: string, updates: any, shouldSave?: boolean) => void,
): void {
  const { handle, elementId, initialPoints } = state;
  let nextPoints = [...initialPoints];

  let targetPos = pos;
  // Shift constraint: snap line angle to 15-degree steps
  if (e.shiftKey && (handle === "line-start" || handle === "line-end")) {
    const anchor =
      handle === "line-start"
        ? initialPoints[initialPoints.length - 1]
        : initialPoints[0];
    const dx = pos.x - anchor.x;
    const dy = pos.y - anchor.y;
    const dist = Math.hypot(dx, dy);
    let angle = Math.atan2(dy, dx);
    const step = Math.PI / 12; // 15 degrees
    angle = Math.round(angle / step) * step;
    targetPos = {
      x: anchor.x + dist * Math.cos(angle),
      y: anchor.y + dist * Math.sin(angle),
    };
  }

  if (handle === "line-start") {
    nextPoints[0] = targetPos;
  } else if (handle === "line-end") {
    nextPoints[nextPoints.length - 1] = targetPos;
  } else if (handle === "line-mid") {
    if (nextPoints.length === 2) {
      nextPoints = [nextPoints[0], pos, nextPoints[1]];
    } else {
      nextPoints[1] = pos;
    }
  }

  updateElement(elementId, { points: nextPoints }, false);
}
