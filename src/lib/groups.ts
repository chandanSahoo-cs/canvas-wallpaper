import { CanvasElement } from '../elements/types';
import { newId } from './utils';

/**
 * Returns all elements that share any group ID in common with seedIds (transitively).
 * Matches Excalidraw's group selection behavior: selecting one element in a group
 * selects all members of that group and any parent/nested groups.
 */
export function getConnectedGroupElementIds(
  elements: CanvasElement[],
  seedIds: Iterable<string>
): Set<string> {
  const result = new Set<string>(seedIds);
  if (result.size === 0) return result;

  let changed = true;
  while (changed) {
    changed = false;
    const activeGroupIds = new Set<string>();

    // Collect all group IDs present on currently selected elements
    for (const el of elements) {
      if (result.has(el.id) && el.groupIds && el.groupIds.length > 0) {
        for (const gid of el.groupIds) {
          activeGroupIds.add(gid);
        }
      }
    }

    if (activeGroupIds.size === 0) break;

    // Add all elements in the scene that share ANY of the active group IDs
    for (const el of elements) {
      if (!result.has(el.id) && el.groupIds && el.groupIds.length > 0) {
        if (el.groupIds.some((gid) => activeGroupIds.has(gid))) {
          result.add(el.id);
          changed = true;
        }
      }
    }
  }

  return result;
}

/**
 * Returns all elements belonging to a specific group ID.
 */
export function getElementsInGroup(
  elements: CanvasElement[],
  groupId: string
): CanvasElement[] {
  return elements.filter((el) => el.groupIds && el.groupIds.includes(groupId));
}

/**
 * Groups the selected elements by appending a new unique group ID.
 */
export function groupElements(
  elements: CanvasElement[],
  selectedIds: Set<string>
): { elements: CanvasElement[]; newGroupId: string } {
  const newGroupId = newId();
  const updatedElements = elements.map((el) => {
    if (!selectedIds.has(el.id)) return el;
    return {
      ...el,
      groupIds: [...(el.groupIds || []), newGroupId],
    };
  });
  return { elements: updatedElements, newGroupId };
}

/**
 * Ungroups the selected elements by removing the outermost group(s).
 */
export function ungroupElements(
  elements: CanvasElement[],
  selectedIds: Set<string>
): CanvasElement[] {
  // Find outermost group IDs present on the selected elements
  const targetGroupIds = new Set<string>();
  for (const el of elements) {
    if (selectedIds.has(el.id) && el.groupIds && el.groupIds.length > 0) {
      targetGroupIds.add(el.groupIds[el.groupIds.length - 1]);
    }
  }

  if (targetGroupIds.size === 0) {
    return elements.map((el) => {
      if (!selectedIds.has(el.id) || !el.groupIds || el.groupIds.length === 0) return el;
      return {
        ...el,
        groupIds: el.groupIds.slice(0, -1),
      };
    });
  }

  return elements.map((el) => {
    if (!el.groupIds || el.groupIds.length === 0) return el;
    const filteredGroupIds = el.groupIds.filter((gid) => !targetGroupIds.has(gid));
    if (filteredGroupIds.length === el.groupIds.length) return el;
    return {
      ...el,
      groupIds: filteredGroupIds,
    };
  });
}
