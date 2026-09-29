import { Point, CanvasElement } from "../../elements/types";
import { BoundingBox, SelectionFrame } from "../../canvas/geometry";

export interface ResizeState {
  handle: string;
  angle: number;
  center: Point;
  origBBox: { x: number; y: number; w: number; h: number };
  members: { id: string; snapshot: CanvasElement }[];
  historyPushed: boolean;
}

export interface RotateState {
  center: Point;
  startPointerAngle: number;
  lastPointerAngle: number;
  totalDelta: number;
  origBBox: BoundingBox;
  origAngle: number;
  members: {
    id: string;
    startAngle: number;
    snapshot: CanvasElement;
    origCenter: Point;
  }[];
  historyPushed: boolean;
  activeAngleDegrees: number | null;
  activeFrame: SelectionFrame | null;
  activeHandlePos: Point | null;
}

export interface MoveState {
  pos: Point;
  snapshots: { id: string; snapshot: CanvasElement }[];
  historyPushed: boolean;
  hasDuplicated?: boolean;
}

export interface MarqueeState {
  start: Point;
  current: Point;
}

export interface LineHandleState {
  handle: "line-start" | "line-mid" | "line-end";
  elementId: string;
  initialPoints: Point[];
  historyPushed: boolean;
}
