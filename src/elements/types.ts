export type Point = { x: number; y: number };

export type FillStyle = 'solid' | 'hachure' | 'cross-hatch';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface BaseElement {
  id: string;
  type: string;
  strokeColor: string;
  fillColor: string;
  fillStyle?: FillStyle;
  strokeWidth: number;
  strokeStyle?: StrokeStyle;
  roughness?: number;
  opacity: number;
  locked: boolean;
  angle?: number;
  groupIds?: string[];
  seed: number;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiamondElement extends BaseElement {
  type: 'diamond';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: [Point, Point];
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: [Point, Point];
}

export interface FreedrawElement extends BaseElement {
  type: 'freedraw';
  points: Point[];
}

export interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export type CanvasElement =
  | RectangleElement
  | DiamondElement
  | EllipseElement
  | LineElement
  | ArrowElement
  | FreedrawElement
  | TextElement
  | ImageElement;

export type ToolType =
  | 'selection'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text'
  | 'eraser';

export type BackgroundType = 'color' | 'gradient' | 'image';
export type PatternType = 'none' | 'dots' | 'grid' | 'lines';

export interface BackgroundConfig {
  type: BackgroundType;
  color: string; // solid color or fallback
  gradient?: string; // CSS gradient string
  imageUrl?: string; // base64 data url
  pattern?: PatternType;
}
