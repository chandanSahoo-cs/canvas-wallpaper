import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import { Point, TextElement } from '../elements/types';
import { FONT_SIZE_MAP } from '../canvas/geometry';

export class TextTool implements Tool {
  onPointerDown({ pos, e }: ToolContext): void {
    e.preventDefault();
    openTextEditor(pos);
  }

  onPointerMove(): void {}
  onPointerUp(): void {}

  getCursor(): string {
    return 'text';
  }
}

export function openTextEditor(
  canvasPos: Point,
  existingElement?: TextElement
): void {
  const store = useAppStore.getState();
  const fontSize =
    existingElement?.fontSize ||
    FONT_SIZE_MAP[existingElement ? existingElement.strokeWidth : store.currentStrokeWidth] ||
    20;

  store.setEditingText({
    elementId: existingElement ? existingElement.id : null,
    canvasX: existingElement ? existingElement.x : canvasPos.x,
    canvasY: existingElement ? existingElement.y : canvasPos.y,
    text: existingElement ? existingElement.text || '' : '',
    fontSize,
    strokeColor: existingElement ? existingElement.strokeColor : store.currentStrokeColor,
    angle: existingElement ? existingElement.angle : 0,
  });
}
