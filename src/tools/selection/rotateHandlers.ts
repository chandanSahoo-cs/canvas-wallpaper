import { Point } from "../../elements/types";
import {
  distance,
  rotatePoint,
  normalizeAngle,
  angleToDegrees,
  getHandlePositions,
  SelectionFrame,
} from "../../canvas/geometry";
import { RotateState } from "./types";

export function handleRotatePointerMove(
  pos: Point,
  state: RotateState,
  e: PointerEvent,
  updateElement: (id: string, updates: any, shouldSave?: boolean) => void,
): boolean {
  if (distance(pos, state.center) < 5) return false;

  const current = Math.atan2(pos.y - state.center.y, pos.x - state.center.x);

  // Unwrapped step delta to avoid jumps when crossing (-PI, PI]
  let stepDelta = current - state.lastPointerAngle;
  while (stepDelta > Math.PI) stepDelta -= 2 * Math.PI;
  while (stepDelta <= -Math.PI) stepDelta += 2 * Math.PI;
  state.totalDelta += stepDelta;
  state.lastPointerAngle = current;

  let delta = state.totalDelta;

  const firstAngle = state.members[0].startAngle;
  const allSameAngle = state.members.every(
    (m) => Math.abs(m.startAngle - firstAngle) < 1e-4,
  );

  // Shift constrain rotation to 15-degree steps
  if (e.shiftKey) {
    const step = Math.PI / 12; // 15 degrees
    if (allSameAngle) {
      const rawTarget = firstAngle + delta;
      const snapped = Math.round(rawTarget / step) * step;
      delta = snapped - firstAngle;
    } else {
      delta = Math.round(delta / step) * step;
    }
  }

  state.members.forEach((m) => {
    if ("points" in m.snapshot && m.snapshot.points) {
      // Lines, arrows, freedraw: rotate points directly around the rotation center
      updateElement(
        m.id,
        {
          angle: 0,
          points: m.snapshot.points.map((p: Point) =>
            rotatePoint(p, state.center, delta),
          ),
        },
        false,
      );
    } else if ("x" in m.snapshot) {
      const newAngle = normalizeAngle(m.startAngle + delta);
      const newCenter = rotatePoint(m.origCenter, state.center, delta);
      const shift = {
        x: newCenter.x - m.origCenter.x,
        y: newCenter.y - m.origCenter.y,
      };
      updateElement(
        m.id,
        {
          angle: newAngle,
          x: m.snapshot.x + shift.x,
          y: m.snapshot.y + shift.y,
        },
        false,
      );
    }
  });

  const activeAngle = normalizeAngle(state.origAngle + delta);
  const activeFrame: SelectionFrame = {
    bbox: state.origBBox,
    angle: activeAngle,
    center: state.center,
    isLine: false,
  };
  const activeHandles = getHandlePositions(activeFrame);

  state.activeAngleDegrees = angleToDegrees(
    allSameAngle ? firstAngle + delta : delta,
  );
  state.activeFrame = activeFrame;
  state.activeHandlePos = activeHandles.rotate || null;
  return true;
}
