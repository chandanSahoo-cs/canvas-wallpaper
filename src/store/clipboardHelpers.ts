import { CanvasElement, Point } from '../elements/types';
import { newId, randomSeed } from '../lib/utils';

export function duplicateElements(
  elements: CanvasElement[],
  selectedIds: Set<string>
): { newElements: CanvasElement[]; newIds: string[] } {
  const groupIdMap = new Map<string, string>();
  const newElements: CanvasElement[] = [];
  const newIds: string[] = [];

  elements.forEach((el) => {
    if (!selectedIds.has(el.id) || el.locked) return;
    const clone = JSON.parse(JSON.stringify(el)) as CanvasElement;
    clone.id = newId();
    if (clone.groupIds && clone.groupIds.length) {
      clone.groupIds = clone.groupIds.map((gid) => {
        if (!groupIdMap.has(gid)) groupIdMap.set(gid, newId());
        return groupIdMap.get(gid)!;
      });
    }
    if ('points' in clone && clone.points) {
      clone.points = clone.points.map((p) => ({ x: p.x + 12, y: p.y + 12 })) as [Point, Point] & Point[];
    } else if ('x' in clone && 'y' in clone) {
      clone.x += 12;
      clone.y += 12;
    }
    newElements.push(clone);
    newIds.push(clone.id);
  });

  return { newElements, newIds };
}

export function preparePastedElements(
  source: CanvasElement[],
  pasteOffsetMultiplier: number
): { newElements: CanvasElement[]; newIds: string[]; nextMultiplier: number } {
  const offset = 20 * pasteOffsetMultiplier;
  const nextMultiplier = (pasteOffsetMultiplier % 15) + 1;

  const groupIdMap = new Map<string, string>();
  const newElements: CanvasElement[] = [];
  const newIds: string[] = [];

  source.forEach((el) => {
    const clone = JSON.parse(JSON.stringify(el)) as CanvasElement;
    clone.id = newId();
    clone.locked = false;
    clone.seed = randomSeed();

    if (clone.groupIds && clone.groupIds.length) {
      clone.groupIds = clone.groupIds.map((gid) => {
        if (!groupIdMap.has(gid)) groupIdMap.set(gid, newId());
        return groupIdMap.get(gid)!;
      });
    }

    if ('points' in clone && Array.isArray(clone.points)) {
      clone.points = clone.points.map((p) => ({
        x: p.x + offset,
        y: p.y + offset,
      })) as [Point, Point] & Point[];
    } else if (
      'x' in clone &&
      'y' in clone &&
      typeof clone.x === 'number' &&
      typeof clone.y === 'number'
    ) {
      clone.x += offset;
      clone.y += offset;
    }

    newElements.push(clone);
    newIds.push(clone.id);
  });

  return { newElements, newIds, nextMultiplier };
}
