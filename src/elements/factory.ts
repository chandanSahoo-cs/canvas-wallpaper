import { CanvasElement, ToolType, Point } from './types';
import { newId, randomSeed } from '../lib/utils';

export interface ElementDefaults {
  strokeColor: string;
  fillColor: string;
  fillStyle?: 'solid' | 'hachure' | 'cross-hatch';
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  roughness?: number;
  opacity: number;
}

export function createElement(
  type: ToolType,
  pos: Point,
  defaults: ElementDefaults
): CanvasElement | null {
  const base = {
    id: newId(),
    angle: 0,
    locked: false,
    groupIds: [],
    strokeColor: defaults.strokeColor,
    fillColor: defaults.fillColor,
    fillStyle: defaults.fillStyle ?? 'solid',
    strokeWidth: defaults.strokeWidth,
    strokeStyle: defaults.strokeStyle ?? 'solid',
    roughness: defaults.roughness ?? 1.4,
    opacity: defaults.opacity,
    seed: randomSeed(),
  };

  switch (type) {
    case 'freedraw':
      return { ...base, type: 'freedraw', points: [pos] };
    case 'line':
      return { ...base, type: 'line', points: [pos, pos] };
    case 'arrow':
      return { ...base, type: 'arrow', points: [pos, pos] };
    case 'rectangle':
      return { ...base, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0 };
    case 'diamond':
      return { ...base, type: 'diamond', x: pos.x, y: pos.y, width: 0, height: 0 };
    case 'ellipse':
      return { ...base, type: 'ellipse', x: pos.x, y: pos.y, width: 0, height: 0 };
    default:
      return null;
  }
}
