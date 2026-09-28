import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import {
  Point,
  LineElement,
  ArrowElement,
} from '../elements/types';
import {
  computeSelectionFrame,
  hitTestHandle,
  isPointInsideSelectionFrame,
  elementContains,
  rectsIntersect,
  rotatePoint,
  angleToDegrees,
  getCenter,
  getBBox,
  getScreenBBox,
  distance,
  SelectionFrame,
  getHandlePositions,
  RotationOverlay,
  getResizeCursor,
} from '../canvas/geometry';
import {
  ResizeState,
  RotateState,
  MoveState,
  MarqueeState,
  LineHandleState,
} from './selection/types';
import { handleResizePointerMove } from './selection/resizeHandlers';
import { handleRotatePointerMove } from './selection/rotateHandlers';
import { handleLineHandlePointerMove } from './selection/lineHandlers';

export class SelectionTool implements Tool {
  private resizeState: ResizeState | null = null;
  private rotateState: RotateState | null = null;
  private moveState: MoveState | null = null;
  private lineHandleState: LineHandleState | null = null;
  public marqueeState: MarqueeState | null = null;

  public clear() {
    this.resizeState = null;
    this.rotateState = null;
    this.moveState = null;
    this.lineHandleState = null;
    this.marqueeState = null;
  }

  public getRotationOverlay(): RotationOverlay | null {
    if (
      !this.rotateState ||
      this.rotateState.activeAngleDegrees === null ||
      !this.rotateState.activeHandlePos ||
      !this.rotateState.activeFrame
    ) {
      return null;
    }
    return {
      frame: this.rotateState.activeFrame,
      degrees: this.rotateState.activeAngleDegrees,
      handlePos: this.rotateState.activeHandlePos,
    };
  }

  onPointerDown({ pos, e, canvas }: ToolContext): void {
    const store = useAppStore.getState();
    const { elements, selectedIds, selectGroupMembers } = store;

    canvas.setPointerCapture(e.pointerId);

    const selectedMembers = elements.filter((el) => selectedIds.has(el.id));
    const allLocked = selectedMembers.length > 0 && selectedMembers.every((el) => el.locked);
    const anyLocked = selectedMembers.some((el) => el.locked);
    const hasGroup = selectedMembers.some((el) => el.groupIds && el.groupIds.length > 0);
    const isGrouped =
      hasGroup &&
      (selectedMembers.length > 1 ||
        (selectedMembers[0]?.groupIds && selectedMembers[0].groupIds.length > 0));

    // Check hit on Lock marker or Group marker of selection
    if (selectedMembers.length > 0) {
      const frame = computeSelectionFrame(selectedMembers);
      if (frame) {
        const b = frame.bbox;
        const PAD = 8;
        const x0 = b.x - PAD;
        const x1 = b.x + b.w + PAD;
        const y0 = b.y - PAD;
        const narrow = x1 - x0 < 45;
        const lockOffset = narrow && isGrouped ? 8 : 0;
        const groupOffset = narrow && (allLocked || anyLocked) ? -8 : 0;

        if (anyLocked || allLocked) {
          const lockPos = rotatePoint(
            { x: x1 + lockOffset, y: y0 - 14 },
            frame.center,
            frame.angle
          );
          if (distance(pos, lockPos) <= 14) {
            store.toggleLockSelected();
            return;
          }
        }

        if (isGrouped) {
          const groupPos = rotatePoint(
            { x: x0 + groupOffset, y: y0 - 14 },
            frame.center,
            frame.angle
          );
          if (distance(pos, groupPos) <= 14) {
            store.ungroupSelected();
            return;
          }
        }
      }
    }

    // Check hit on Lock badge of an unselected locked element
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.locked && !selectedIds.has(el.id)) {
        const b = getBBox(el);
        const center = getCenter(el);
        const tr = rotatePoint({ x: b.x + b.w + 4, y: b.y - 12 }, center, el.angle || 0);
        if (distance(pos, tr) <= 14) {
          store.setSelectedIds(new Set([el.id]));
          store.toggleLockSelected();
          return;
        }
      }
    }

    // 1. Check resize/rotate handle hit
    if (selectedMembers.length > 0 && !allLocked) {
      const frame = computeSelectionFrame(selectedMembers);
      if (frame) {
        const handle = hitTestHandle(pos, frame);
        if (handle && handle.startsWith('line-')) {
          const el = selectedMembers[0] as LineElement | ArrowElement;
          this.lineHandleState = {
            handle: handle as 'line-start' | 'line-mid' | 'line-end',
            elementId: el.id,
            initialPoints: JSON.parse(JSON.stringify(el.points)),
            historyPushed: false,
          };
          return;
        }
        if (handle === 'rotate') {
          const members = selectedMembers
            .filter((el) => !el.locked)
            .map((el) => ({
              id: el.id,
              startAngle: el.angle || 0,
              snapshot: JSON.parse(JSON.stringify(el)),
              origCenter: getCenter(el),
            }));
          if (members.length > 0) {
            const startPointerAngle = Math.atan2(pos.y - frame.center.y, pos.x - frame.center.x);
            const firstAngle = members[0].startAngle;
            const allSameAngle = members.every(
              (m) => Math.abs(m.startAngle - firstAngle) < 1e-4
            );
            const initialDegrees = angleToDegrees(allSameAngle ? firstAngle : 0);
            const handles = getHandlePositions(frame);
            this.rotateState = {
              center: frame.center,
              startPointerAngle,
              lastPointerAngle: startPointerAngle,
              totalDelta: 0,
              origBBox: frame.bbox,
              origAngle: frame.angle,
              members,
              historyPushed: false,
              activeAngleDegrees: initialDegrees,
              activeFrame: frame,
              activeHandlePos: handles.rotate || pos,
            };
            return;
          }
        }
        if (handle) {
          const members = selectedMembers
            .filter((el) => !el.locked)
            .map((el) => ({ id: el.id, snapshot: JSON.parse(JSON.stringify(el)) }));
          if (members.length > 0) {
            this.resizeState = {
              handle,
              angle: frame.angle,
              center: frame.center,
              origBBox: frame.bbox,
              members,
              historyPushed: false,
            };
            return;
          }
        }
      }
    }

    // 2. If click is inside current selected frame, do NOT deselect; prepare to move current selection
    if (selectedMembers.length > 0 && !e.shiftKey) {
      const frame = computeSelectionFrame(selectedMembers);
      const isInsideSelection =
        frame &&
        (isPointInsideSelectionFrame(pos, frame) ||
          selectedMembers.some((el) => {
            const local = el.angle ? rotatePoint(pos, getCenter(el), -el.angle) : pos;
            return elementContains(el, local);
          }));

      if (isInsideSelection) {
        const currentSelectedMembers = selectedMembers.filter((el) => !el.locked);
        const snaps = currentSelectedMembers.map((el) => ({
          id: el.id,
          snapshot: JSON.parse(JSON.stringify(el)),
        }));
        this.moveState = snaps.length ? { pos, snapshots: snaps, historyPushed: false } : null;
        return;
      }
    }

    // 3. Hit-test elements (top-to-bottom in z-order)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const local = el.angle ? rotatePoint(pos, getCenter(el), -el.angle) : pos;
      if (elementContains(el, local)) {
        if (el.locked) {
          store.setSelectedIds(new Set([el.id]));
          return;
        }

        selectGroupMembers(el.id, e.shiftKey);

        const currentSelectedMembers = useAppStore
          .getState()
          .elements.filter((m) => useAppStore.getState().selectedIds.has(m.id) && !m.locked);
        const snaps = currentSelectedMembers.map((m) => ({
          id: m.id,
          snapshot: JSON.parse(JSON.stringify(m)),
        }));
        this.moveState = snaps.length ? { pos, snapshots: snaps, historyPushed: false } : null;
        return;
      }
    }

    // 4. Clicked on empty space: clear selection unless Shift is held, and start marquee
    if (!e.shiftKey) {
      store.setSelectedIds(new Set());
    }
    this.marqueeState = { start: pos, current: pos };
  }

  onPointerMove({ pos, e }: ToolContext): void {
    const store = useAppStore.getState();

    // 0. Line Control Points
    if (this.lineHandleState) {
      if (!this.lineHandleState.historyPushed) {
        store.pushHistory();
        this.lineHandleState.historyPushed = true;
      }
      handleLineHandlePointerMove(pos, this.lineHandleState, e, store.updateElement);
      return;
    }

    // 1. Resize
    if (this.resizeState) {
      if (!this.resizeState.historyPushed) {
        store.pushHistory();
        this.resizeState.historyPushed = true;
      }
      handleResizePointerMove(pos, this.resizeState, e, store.updateElement);
      return;
    }

    // 2. Rotate
    if (this.rotateState) {
      if (!this.rotateState.historyPushed) {
        store.pushHistory();
        this.rotateState.historyPushed = true;
      }
      handleRotatePointerMove(pos, this.rotateState, e, store.updateElement);
      return;
    }

    // 3. Move
    if (this.moveState) {
      if (!this.moveState.historyPushed) {
        store.pushHistory();
        this.moveState.historyPushed = true;
      }

      // Alt key: duplicate selection on drag
      if (e.altKey && !this.moveState.hasDuplicated) {
        store.duplicateSelected();
        this.moveState.hasDuplicated = true;
        const updatedSelected = useAppStore.getState().selectedIds;
        const currentSelectedMembers = useAppStore
          .getState()
          .elements.filter((el) => updatedSelected.has(el.id) && !el.locked);
        this.moveState.snapshots = currentSelectedMembers.map((el) => ({
          id: el.id,
          snapshot: JSON.parse(JSON.stringify(el)),
        }));
      }

      let dx = pos.x - this.moveState.pos.x;
      let dy = pos.y - this.moveState.pos.y;

      // Shift key constraint: lock to horizontal or vertical axis
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dy = 0;
        } else {
          dx = 0;
        }
      }

      store.moveSelected(this.moveState.snapshots, dx, dy);
      return;
    }

    // 4. Marquee
    if (this.marqueeState) {
      this.marqueeState.current = pos;
      const mRect = {
        x: Math.min(this.marqueeState.start.x, pos.x),
        y: Math.min(this.marqueeState.start.y, pos.y),
        w: Math.abs(pos.x - this.marqueeState.start.x),
        h: Math.abs(pos.y - this.marqueeState.start.y),
      };
      const matchingIds = store.elements
        .filter((el) => !el.locked && rectsIntersect(mRect, getScreenBBox(el)))
        .map((el) => el.id);
      store.setSelectedIds(matchingIds);
    }
  }

  onPointerUp(): void {
    const store = useAppStore.getState();
    if (this.lineHandleState) {
      this.lineHandleState = null;
      store.saveToStorage();
    }
    if (this.resizeState) {
      this.resizeState = null;
      store.saveToStorage();
    }
    if (this.rotateState) {
      this.rotateState = null;
      store.saveToStorage();
    }
    if (this.moveState) {
      this.moveState = null;
      store.saveToStorage();
    }
    if (this.marqueeState) {
      this.marqueeState = null;
    }
  }

  onPointerCancel(): void {
    this.onPointerUp();
  }

  getCursor(pos?: Point): string {
    if (this.lineHandleState) return 'crosshair';
    if (this.rotateState) return 'grabbing';
    if (this.resizeState) {
      return getResizeCursor(this.resizeState.handle, this.resizeState.angle);
    }
    if (!pos) return 'default';
    const store = useAppStore.getState();
    const selectedMembers = store.elements.filter((el) => store.selectedIds.has(el.id));
    if (selectedMembers.length > 0) {
      const anyLocked = selectedMembers.some((el) => el.locked);
      const allLocked = selectedMembers.every((el) => el.locked);
      const hasGroup = selectedMembers.some((el) => el.groupIds && el.groupIds.length > 0);
      const isGrouped =
        hasGroup &&
        (selectedMembers.length > 1 ||
          (selectedMembers[0]?.groupIds && selectedMembers[0].groupIds.length > 0));

      const frame = computeSelectionFrame(selectedMembers);
      if (frame) {
        const b = frame.bbox;
        const PAD = 8;
        const x0 = b.x - PAD;
        const x1 = b.x + b.w + PAD;
        const y0 = b.y - PAD;
        const narrow = x1 - x0 < 45;
        const lockOffset = narrow && isGrouped ? 8 : 0;
        const groupOffset = narrow && (allLocked || anyLocked) ? -8 : 0;

        if (anyLocked || allLocked) {
          const lockPos = rotatePoint(
            { x: x1 + lockOffset, y: y0 - 14 },
            frame.center,
            frame.angle
          );
          if (distance(pos, lockPos) <= 14) return 'pointer';
        }

        if (isGrouped) {
          const groupPos = rotatePoint(
            { x: x0 + groupOffset, y: y0 - 14 },
            frame.center,
            frame.angle
          );
          if (distance(pos, groupPos) <= 14) return 'pointer';
        }

        if (!allLocked) {
          const handle = hitTestHandle(pos, frame);
          if (handle && handle.startsWith('line-')) return 'crosshair';
          if (handle === 'rotate') return 'grab';
          if (handle) {
            return getResizeCursor(handle, frame.angle);
          }
          if (
            isPointInsideSelectionFrame(pos, frame) ||
            selectedMembers.some((el) => {
              const local = el.angle ? rotatePoint(pos, getCenter(el), -el.angle) : pos;
              return elementContains(el, local);
            })
          ) {
            return 'move';
          }
        }
      }
    }

    // Hover over unselected locked element badge
    for (const el of store.elements) {
      if (el.locked && !store.selectedIds.has(el.id)) {
        const b = getBBox(el);
        const center = getCenter(el);
        const tr = rotatePoint({ x: b.x + b.w + 4, y: b.y - 12 }, center, el.angle || 0);
        if (distance(pos, tr) <= 14) return 'pointer';
      }
    }

    return 'default';
  }
}
