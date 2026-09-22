import { Tool, ToolContext } from './types';
import { useAppStore } from '../store/useAppStore';
import {
  Point,
  CanvasElement,
  TextElement,
  LineElement,
  ArrowElement,
} from '../elements/types';
import {
  computeSelectionFrame,
  hitTestHandle,
  elementContains,
  rectsIntersect,
  rotatePoint,
  getCenter,
  getBBox,
  getScreenBBox,
  normBox,
  distance,
  FONT_SIZE_MAP,
} from '../canvas/geometry';

interface ResizeState {
  handle: string;
  angle: number;
  center: Point;
  origBBox: { x: number; y: number; w: number; h: number };
  members: { id: string; snapshot: CanvasElement }[];
  historyPushed: boolean;
}

interface RotateState {
  center: Point;
  startPointerAngle: number;
  members: { id: string; startAngle: number; snapshot: CanvasElement; origCenter: Point }[];
  historyPushed: boolean;
}

interface MoveState {
  pos: Point;
  snapshots: { id: string; snapshot: CanvasElement }[];
  historyPushed: boolean;
}

interface MarqueeState {
  start: Point;
  current: Point;
}

interface LineHandleState {
  handle: 'line-start' | 'line-mid' | 'line-end';
  elementId: string;
  initialPoints: Point[];
  historyPushed: boolean;
}

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

  onPointerDown({ pos, e, canvas }: ToolContext): void {
    const store = useAppStore.getState();
    const { elements, selectedIds, selectGroupMembers, pushHistory } = store;

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
            this.rotateState = {
              center: frame.center,
              startPointerAngle: Math.atan2(pos.y - frame.center.y, pos.x - frame.center.x),
              members,
              historyPushed: false,
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

    // 2. Hit test elements (top to bottom)
    let hit: CanvasElement | null = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const local = el.angle ? rotatePoint(pos, getCenter(el), -el.angle) : pos;
      if (elementContains(el, local)) {
        hit = el;
        break;
      }
    }

    if (hit) {
      selectGroupMembers(hit.id, e.shiftKey);
      const updatedSelected = useAppStore.getState().selectedIds;
      if (updatedSelected.has(hit.id)) {
        const currentSelectedMembers = useAppStore
          .getState()
          .elements.filter((el) => updatedSelected.has(el.id) && !el.locked);
        const snaps = currentSelectedMembers.map((el) => ({
          id: el.id,
          snapshot: JSON.parse(JSON.stringify(el)),
        }));
        this.moveState = snaps.length ? { pos, snapshots: snaps, historyPushed: false } : null;
      }
    } else {
      if (!e.shiftKey) {
        store.setSelectedIds(new Set());
      }
      this.marqueeState = { start: pos, current: pos };
    }
  }

  onPointerMove({ pos, e }: ToolContext): void {
    const store = useAppStore.getState();

    // 0. Line handle drag (start, mid, end)
    if (this.lineHandleState) {
      if (!this.lineHandleState.historyPushed) {
        store.pushHistory();
        this.lineHandleState.historyPushed = true;
      }
      const { handle, elementId, initialPoints } = this.lineHandleState;
      let nextPoints = [...initialPoints];

      if (handle === 'line-start') {
        nextPoints[0] = pos;
      } else if (handle === 'line-end') {
        nextPoints[nextPoints.length - 1] = pos;
      } else if (handle === 'line-mid') {
        if (nextPoints.length === 2) {
          nextPoints = [nextPoints[0], pos, nextPoints[1]];
        } else {
          nextPoints[1] = pos;
        }
      }

      store.updateElement(elementId, { points: nextPoints });
      return;
    }

    // 1. Resize
    if (this.resizeState) {
      if (!this.resizeState.historyPushed) {
        store.pushHistory();
        this.resizeState.historyPushed = true;
      }
      const { handle, angle, center, origBBox, members } = this.resizeState;
      const localPos = rotatePoint(pos, center, -angle);

      let anchorX = origBBox.x,
        anchorY = origBBox.y;
      if (handle.includes('w')) anchorX = origBBox.x + origBBox.w;
      if (handle.includes('n')) anchorY = origBBox.y + origBBox.h;

      let newW = origBBox.w,
        newH = origBBox.h;
      if (handle.includes('e')) newW = localPos.x - anchorX;
      if (handle.includes('w')) newW = anchorX - localPos.x;
      if (handle.includes('s')) newH = localPos.y - anchorY;
      if (handle.includes('n')) newH = anchorY - localPos.y;

      // Shift constraint for proportional aspect ratio
      if (e.shiftKey) {
        const maxScale = Math.max(Math.abs(newW / (origBBox.w || 1)), Math.abs(newH / (origBBox.h || 1)));
        newW = origBBox.w * maxScale * Math.sign(newW);
        newH = origBBox.h * maxScale * Math.sign(newH);
      }

      if (Math.abs(newW) < 4) newW = 4 * (Math.sign(newW) || 1);
      if (Math.abs(newH) < 4) newH = 4 * (Math.sign(newH) || 1);

      const sx = origBBox.w !== 0 ? newW / origBBox.w : 1;
      const sy = origBBox.h !== 0 ? newH / origBBox.h : 1;

      members.forEach(({ id, snapshot }) => {
        if ('points' in snapshot && snapshot.points) {
          store.updateElement(id, {
            points: snapshot.points.map((p) => ({
              x: anchorX + (p.x - anchorX) * sx,
              y: anchorY + (p.y - anchorY) * sy,
            })) as any,
          });
        } else if ('x' in snapshot && 'width' in snapshot) {
          store.updateElement(id, {
            x: anchorX + (snapshot.x - anchorX) * sx,
            y: anchorY + (snapshot.y - anchorY) * sy,
            width: snapshot.width * sx,
            height: snapshot.height * sy,
          });
        } else if (snapshot.type === 'text') {
          const textEl = snapshot as TextElement;
          const origFontSize = textEl.fontSize || FONT_SIZE_MAP[textEl.strokeWidth] || 20;
          const scale = Math.max(
            0.2,
            handle === 'e' || handle === 'w'
              ? Math.abs(sx)
              : handle === 'n' || handle === 's'
              ? Math.abs(sy)
              : Math.max(Math.abs(sx), Math.abs(sy))
          );
          const newFontSize = Math.max(8, Math.min(240, Math.round(origFontSize * scale)));

          let newX = textEl.x;
          let newY = textEl.y;
          if (handle.includes('w')) {
            newX = anchorX - origBBox.w * scale;
          } else if (handle.includes('e')) {
            newX = anchorX;
          }
          if (handle.includes('n')) {
            newY = anchorY - origBBox.h * scale;
          } else if (handle.includes('s')) {
            newY = anchorY;
          }

          store.updateElement(id, {
            x: newX,
            y: newY,
            fontSize: newFontSize,
          });
        }
      });
      return;
    }

    // 2. Rotate
    if (this.rotateState) {
      if (distance(pos, this.rotateState.center) < 5) return;
      if (!this.rotateState.historyPushed) {
        store.pushHistory();
        this.rotateState.historyPushed = true;
      }
      const current = Math.atan2(pos.y - this.rotateState.center.y, pos.x - this.rotateState.center.x);
      let delta = current - this.rotateState.startPointerAngle;

      // Shift constrain rotation to 15-degree steps
      if (e.shiftKey) {
        const step = Math.PI / 12; // 15 degrees
        delta = Math.round(delta / step) * step;
      }

      this.rotateState.members.forEach((m) => {
        const newAngle = m.startAngle + delta;
        const newCenter = rotatePoint(m.origCenter, this.rotateState!.center, delta);
        const shift = { x: newCenter.x - m.origCenter.x, y: newCenter.y - m.origCenter.y };

        if ('points' in m.snapshot && m.snapshot.points) {
          store.updateElement(m.id, {
            angle: newAngle,
            points: m.snapshot.points.map((p) => ({ x: p.x + shift.x, y: p.y + shift.y })) as any,
          });
        } else if ('x' in m.snapshot) {
          store.updateElement(m.id, {
            angle: newAngle,
            x: m.snapshot.x + shift.x,
            y: m.snapshot.y + shift.y,
          });
        }
      });
      return;
    }

    // 3. Move
    if (this.moveState) {
      if (!this.moveState.historyPushed) {
        store.pushHistory();
        this.moveState.historyPushed = true;
      }
      const dx = pos.x - this.moveState.pos.x;
      const dy = pos.y - this.moveState.pos.y;
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
      const h = this.resizeState.handle;
      if (h === 'n' || h === 's') return 'ns-resize';
      if (h === 'e' || h === 'w') return 'ew-resize';
      if (h === 'nw' || h === 'se') return 'nwse-resize';
      if (h === 'ne' || h === 'sw') return 'nesw-resize';
      return 'default';
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
            if (handle === 'n' || handle === 's') return 'ns-resize';
            if (handle === 'e' || handle === 'w') return 'ew-resize';
            if (handle === 'nw' || handle === 'se') return 'nwse-resize';
            if (handle === 'ne' || handle === 'sw') return 'nesw-resize';
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
