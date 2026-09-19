import { Point } from '../elements/types';

export interface ToolContext {
  pos: Point; // Screen to canvas transformed position (accounts for camera zoom & offset)
  rawPos: Point; // Raw screen coordinates relative to canvas bounding box
  e: PointerEvent;
  canvas: HTMLCanvasElement;
}

export interface Tool {
  onPointerDown(ctx: ToolContext): void;
  onPointerMove(ctx: ToolContext): void;
  onPointerUp(ctx: ToolContext): void;
  onPointerCancel?(ctx: ToolContext): void;
  getCursor?(pos?: Point): string;
}
