// PHASE 4 — multi-select: marquee-drag, shift-click, and extending Phase 3's
// resize/rotate math from a single element to a shared selection.
// Still no group/lock (Phase 5) or undo/redo (Phase 6).
//
// Design note: resize/rotate are now written ONCE, generically, operating on
// a "selection frame" (a bbox + angle + center) rather than a single element.
// A single selected element is just a frame with angle = that element's own
// angle — so Phase 3's exact behavior falls out of this as a special case
// rather than being duplicated code.
//
// Simplification worth knowing: when more than one element is selected, the
// shared frame is always an axis-aligned bounding box (angle 0), even if the
// individual members are rotated — it doesn't try to compute one "group tilt."
// Each member still keeps its own angle and rotates/orbits correctly.

const canvas = document.getElementById('wallpaper');
const ctx = canvas.getContext('2d');
const rc = rough.canvas(canvas);

const toggleBtn = document.getElementById('toggleBtn');
const toolSelector = document.getElementById('toolSelector');
const stylePanel = document.getElementById('stylePanel');
const doneBtn = document.getElementById('doneBtn');

const colorPicker = document.getElementById('colorPicker');
const fillPicker = document.getElementById('fillPicker');
const bgPicker = document.getElementById('bgPicker');
const opacityPicker = document.getElementById('opacityPicker');
const clearBtn = document.getElementById('clearBtn');
const duplicateBtn = document.getElementById('duplicateBtn');
const deleteBtn = document.getElementById('deleteBtn');

const strokeSwatches = Array.from(document.querySelectorAll('.swatch.preset.stroke'));
const fillSwatches = Array.from(document.querySelectorAll('.swatch.preset.fill'));
const bgSwatches = Array.from(document.querySelectorAll('.swatch.preset.bg'));
const sizeButtons = Array.from(document.querySelectorAll('.sizebtn'));

const FONT_SIZE_MAP = { 1.5: 16, 3: 20, 5.5: 28 };
const DEFAULT_ROUGHNESS = 1.4;
const HANDLE_HIT_RADIUS = 9;
const ROTATE_HANDLE_OFFSET = 28;

// --- State ---
let elements = [];
let draft = null;
let dragOrigin = null;    // { pos, snapshots: [{id, snapshot}] } while moving the selection
let resizeState = null;   // active resize drag (single or group)
let rotateState = null;   // active rotate drag (single or group)
let marqueeState = null;  // { start, current } while marquee-selecting
let selectedIds = new Set();
let currentTool = 'selection';
let erasing = false;
let drawingMode = false;
let backgroundColor = '#14141a';

let currentStrokeColor = '#1e1e1e';
let currentFillColor = 'transparent';
let currentStrokeWidth = 1.5;
let currentOpacity = 100;

let saveTimeout = null;
let resizeTimeout = null;

function newId() { return Date.now() + '-' + Math.random().toString(36).slice(2, 8); }
function randomSeed() { return Math.floor(Math.random() * 2 ** 31); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// --- Canvas sizing ---
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redraw();
}

function setBackground(color) {
  backgroundColor = color;
  document.body.style.background = color;
}

// --- Geometry helpers ---
function normBox(el) {
  return {
    x: Math.min(el.x, el.x + el.width),
    y: Math.min(el.y, el.y + el.height),
    w: Math.abs(el.width),
    h: Math.abs(el.height)
  };
}

function diamondPoints(x, y, w, h) {
  return [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]];
}

// Bounding box in the element's own LOCAL (unrotated) coordinate space.
function getBBox(el) {
  if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse') return normBox(el);
  if (el.type === 'line' || el.type === 'arrow') {
    const [p0, p1] = el.points;
    return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) };
  }
  if (el.type === 'freedraw') {
    const xs = el.points.map(p => p.x), ys = el.points.map(p => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  if (el.type === 'text') {
    ctx.font = (FONT_SIZE_MAP[el.strokeWidth] || 20) + 'px sans-serif';
    return { x: el.x, y: el.y, w: ctx.measureText(el.text).width, h: (FONT_SIZE_MAP[el.strokeWidth] || 20) * 1.3 };
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}

function getCenter(el) {
  const b = getBBox(el);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

// Axis-aligned box that encloses the element AFTER its own rotation is
// applied — used for marquee intersection and for the multi-select union box.
function getScreenBBox(el) {
  const b = getBBox(el);
  if (!el.angle) return b;
  const center = getCenter(el);
  const corners = [
    { x: b.x, y: b.y }, { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }
  ].map(p => rotatePoint(p, center, el.angle));
  const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

function rotatePoint(pos, center, angle) {
  if (!angle) return pos;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const dx = pos.x - center.x, dy = pos.y - center.y;
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

function distanceToSegment(p, a, b) {
  const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// --- Hit testing ---
function elementContains(el, localPos) {
  if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse' || el.type === 'text') {
    const b = getBBox(el);
    return localPos.x >= b.x - 4 && localPos.x <= b.x + b.w + 4 && localPos.y >= b.y - 4 && localPos.y <= b.y + b.h + 4;
  }
  if (el.type === 'line' || el.type === 'arrow') {
    return distanceToSegment(localPos, el.points[0], el.points[1]) <= 6 + el.strokeWidth;
  }
  if (el.type === 'freedraw') {
    for (let i = 0; i < el.points.length - 1; i++) {
      if (distanceToSegment(localPos, el.points[i], el.points[i + 1]) <= 6 + el.strokeWidth) return true;
    }
    return el.points.length === 1 && distance(localPos, el.points[0]) <= 6 + el.strokeWidth;
  }
  return false;
}

function hitTest(pos) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const local = el.angle ? rotatePoint(pos, getCenter(el), -el.angle) : pos;
    if (elementContains(el, local)) return el;
  }
  return null;
}

// --- Selection frame: the shared bbox+angle+center that handles attach to.
// A single selection reuses that element's own (possibly rotated) frame;
// a multi-selection always uses the axis-aligned union (see note at top). ---
function computeSelectionFrame() {
  const ids = [...selectedIds];
  if (ids.length === 0) return null;
  if (ids.length === 1) {
    const el = elements.find(e => e.id === ids[0]);
    if (!el) return null;
    return { bbox: getBBox(el), angle: el.angle || 0, center: getCenter(el) };
  }
  const boxes = ids.map(id => elements.find(e => e.id === id)).filter(Boolean).map(getScreenBBox);
  if (boxes.length === 0) return null;
  const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
  const x1 = Math.max(...boxes.map(b => b.x + b.w)), y1 = Math.max(...boxes.map(b => b.y + b.h));
  const bbox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  return { bbox, angle: 0, center: { x: x0 + bbox.w / 2, y: y0 + bbox.h / 2 } };
}

// 8 resize handles + 1 rotate handle, in absolute screen coordinates.
function getHandlePositions(frame) {
  const b = frame.bbox;
  const PAD = 8;
  const x0 = b.x - PAD, y0 = b.y - PAD, x1 = b.x + b.w + PAD, y1 = b.y + b.h + PAD;
  const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2;
  const local = {
    nw: { x: x0, y: y0 }, n: { x: midX, y: y0 }, ne: { x: x1, y: y0 },
    e: { x: x1, y: midY }, se: { x: x1, y: y1 }, s: { x: midX, y: y1 },
    sw: { x: x0, y: y1 }, w: { x: x0, y: midY },
    rotate: { x: midX, y: y0 - ROTATE_HANDLE_OFFSET }
  };
  const screen = {};
  for (const key in local) screen[key] = rotatePoint(local[key], frame.center, frame.angle);
  return screen;
}

function hitTestHandle(pos, frame) {
  const handles = getHandlePositions(frame);
  for (const key in handles) {
    if (distance(pos, handles[key]) <= HANDLE_HIT_RADIUS) return key;
  }
  return null;
}

// --- Rendering ---
function roughOptions(el) {
  return {
    stroke: el.strokeColor,
    strokeWidth: el.strokeWidth,
    roughness: DEFAULT_ROUGHNESS,
    fill: el.fillColor === 'transparent' ? undefined : el.fillColor,
    fillStyle: 'solid',
    seed: el.seed
  };
}

function drawFreedraw(el) {
  const pts = el.points;
  if (pts.length < 1) return;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = el.strokeWidth * 2.2;
  ctx.strokeStyle = el.strokeColor;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 1) {
    ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

function drawArrow(el) {
  const [p0, p1] = el.points;
  const opts = roughOptions(el);
  rc.line(p0.x, p0.y, p1.x, p1.y, opts);
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  const headLen = 10 + el.strokeWidth * 3;
  const a1 = angle + Math.PI - 0.5, a2 = angle + Math.PI + 0.5;
  rc.line(p1.x, p1.y, p1.x + headLen * Math.cos(a1), p1.y + headLen * Math.sin(a1), opts);
  rc.line(p1.x, p1.y, p1.x + headLen * Math.cos(a2), p1.y + headLen * Math.sin(a2), opts);
}

function drawText(el) {
  ctx.font = (FONT_SIZE_MAP[el.strokeWidth] || 20) + 'px -apple-system, sans-serif';
  ctx.fillStyle = el.strokeColor;
  ctx.textBaseline = 'top';
  ctx.fillText(el.text, el.x, el.y);
}

function drawElement(el) {
  ctx.save();
  ctx.globalAlpha = (el.opacity ?? 100) / 100;
  if (el.angle) {
    const c = getCenter(el);
    ctx.translate(c.x, c.y);
    ctx.rotate(el.angle);
    ctx.translate(-c.x, -c.y);
  }
  switch (el.type) {
    case 'rectangle': { const nb = normBox(el); rc.rectangle(nb.x, nb.y, nb.w, nb.h, roughOptions(el)); break; }
    case 'diamond': { const nb = normBox(el); rc.polygon(diamondPoints(nb.x, nb.y, nb.w, nb.h), roughOptions(el)); break; }
    case 'ellipse': { const nb = normBox(el); rc.ellipse(nb.x + nb.w / 2, nb.y + nb.h / 2, nb.w, nb.h, roughOptions(el)); break; }
    case 'line': rc.line(el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, roughOptions(el)); break;
    case 'arrow': drawArrow(el); break;
    case 'freedraw': drawFreedraw(el); break;
    case 'text': drawText(el); break;
  }
  ctx.restore();
}

// Thin outline per selected member (only shown for multi-select, so it's
// clear which shapes are included) plus the one shared frame + handles.
function drawSelectionOverlays() {
  if (selectedIds.size > 1) {
    for (const id of selectedIds) {
      const el = elements.find(e => e.id === id);
      if (!el) continue;
      const b = getScreenBBox(el);
      ctx.save();
      ctx.strokeStyle = 'rgba(105, 101, 219, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
      ctx.restore();
    }
  }

  const frame = computeSelectionFrame();
  if (!frame) return;

  ctx.save();
  ctx.translate(frame.center.x, frame.center.y);
  ctx.rotate(frame.angle);
  ctx.translate(-frame.center.x, -frame.center.y);

  const b = frame.bbox;
  const PAD = 8;
  const x0 = b.x - PAD, y0 = b.y - PAD, x1 = b.x + b.w + PAD, y1 = b.y + b.h + PAD;
  const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2;

  ctx.strokeStyle = '#6965db';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(midX, y0);
  ctx.lineTo(midX, y0 - ROTATE_HANDLE_OFFSET);
  ctx.stroke();

  const handlePts = [[x0, y0], [midX, y0], [x1, y0], [x1, midY], [x1, y1], [midX, y1], [x0, y1], [x0, midY]];
  ctx.fillStyle = '#ffffff';
  for (const [hx, hy] of handlePts) {
    ctx.fillRect(hx - 4, hy - 4, 8, 8);
    ctx.strokeRect(hx - 4, hy - 4, 8, 8);
  }

  ctx.beginPath();
  ctx.arc(midX, y0 - ROTATE_HANDLE_OFFSET, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMarquee() {
  if (!marqueeState) return;
  const x0 = Math.min(marqueeState.start.x, marqueeState.current.x);
  const y0 = Math.min(marqueeState.start.y, marqueeState.current.y);
  const w = Math.abs(marqueeState.current.x - marqueeState.start.x);
  const h = Math.abs(marqueeState.current.y - marqueeState.start.y);
  ctx.save();
  ctx.fillStyle = 'rgba(105, 101, 219, 0.08)';
  ctx.strokeStyle = '#6965db';
  ctx.lineWidth = 1;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeRect(x0, y0, w, h);
  ctx.restore();
}

function redraw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const all = draft ? [...elements, draft] : elements;
  for (const el of all) drawElement(el);
  drawSelectionOverlays();
  drawMarquee();
}

function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// --- Move (translation only — rotation-agnostic, works per-member) ---
function moveElement(id, snapshot, dx, dy) {
  const el = elements.find(e => e.id === id);
  if (!el) return;
  if (snapshot.points) el.points = snapshot.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
  else { el.x = snapshot.x + dx; el.y = snapshot.y + dy; }
}

function startMove(pos) {
  dragOrigin = {
    pos,
    snapshots: [...selectedIds].map(id => ({ id, snapshot: JSON.parse(JSON.stringify(elements.find(e => e.id === id))) }))
  };
}

function applyMove(pos) {
  const dx = pos.x - dragOrigin.pos.x, dy = pos.y - dragOrigin.pos.y;
  for (const { id, snapshot } of dragOrigin.snapshots) moveElement(id, snapshot, dx, dy);
}

// --- Resize: generic over 1..N selected elements, scaled relative to the
// shared frame's opposite anchor. A single element is just N=1. ---
function startResize(frame, handle) {
  resizeState = {
    handle, angle: frame.angle, center: frame.center, origBBox: frame.bbox,
    members: [...selectedIds].map(id => ({ id, snapshot: JSON.parse(JSON.stringify(elements.find(e => e.id === id))) }))
  };
}

function applyResize(pos) {
  const { handle, angle, center, origBBox, members } = resizeState;
  const localPos = rotatePoint(pos, center, -angle);

  let anchorX = origBBox.x, anchorY = origBBox.y;
  if (handle.includes('w')) anchorX = origBBox.x + origBBox.w;
  if (handle.includes('n')) anchorY = origBBox.y + origBBox.h;

  let newW = origBBox.w, newH = origBBox.h;
  if (handle.includes('e')) newW = localPos.x - anchorX;
  if (handle.includes('w')) newW = anchorX - localPos.x;
  if (handle.includes('s')) newH = localPos.y - anchorY;
  if (handle.includes('n')) newH = anchorY - localPos.y;

  if (Math.abs(newW) < 4) newW = 4 * (Math.sign(newW) || 1);
  if (Math.abs(newH) < 4) newH = 4 * (Math.sign(newH) || 1);

  const sx = origBBox.w !== 0 ? newW / origBBox.w : 1;
  const sy = origBBox.h !== 0 ? newH / origBBox.h : 1;

  for (const { id, snapshot } of members) {
    const el = elements.find(e => e.id === id);
    if (!el) continue;
    if (snapshot.points) {
      el.points = snapshot.points.map(p => ({
        x: anchorX + (p.x - anchorX) * sx,
        y: anchorY + (p.y - anchorY) * sy
      }));
    } else {
      el.x = anchorX + (snapshot.x - anchorX) * sx;
      el.y = anchorY + (snapshot.y - anchorY) * sy;
      el.width = snapshot.width * sx;
      el.height = snapshot.height * sy;
    }
  }
}

// --- Rotate: generic over 1..N elements. Each orbits the shared center by
// the same delta and spins by the same delta — for a single element the
// orbit distance is zero, so it just spins in place (Phase 3 behavior). ---
function startRotate(frame, pos) {
  rotateState = {
    center: frame.center,
    startPointerAngle: Math.atan2(pos.y - frame.center.y, pos.x - frame.center.x),
    members: [...selectedIds].map(id => {
      const el = elements.find(e => e.id === id);
      return { id, startAngle: el.angle || 0, snapshot: JSON.parse(JSON.stringify(el)), origCenter: getCenter(el) };
    })
  };
}

function applyRotate(pos) {
  const current = Math.atan2(pos.y - rotateState.center.y, pos.x - rotateState.center.x);
  const delta = current - rotateState.startPointerAngle;
  for (const m of rotateState.members) {
    const el = elements.find(e => e.id === m.id);
    if (!el) continue;
    el.angle = m.startAngle + delta;
    const newCenter = rotatePoint(m.origCenter, rotateState.center, delta);
    const shift = { x: newCenter.x - m.origCenter.x, y: newCenter.y - m.origCenter.y };
    if (m.snapshot.points) el.points = m.snapshot.points.map(p => ({ x: p.x + shift.x, y: p.y + shift.y }));
    else { el.x = m.snapshot.x + shift.x; el.y = m.snapshot.y + shift.y; }
  }
}

// --- Pointer handlers ---
canvas.addEventListener('pointerdown', (e) => {
  if (!drawingMode) return;
  const pos = pointerPos(e);

  if (currentTool === 'selection') {
    if (selectedIds.size > 0) {
      const frame = computeSelectionFrame();
      if (frame) {
        const handle = hitTestHandle(pos, frame);
        if (handle === 'rotate') { startRotate(frame, pos); return; }
        if (handle) { startResize(frame, handle); return; }
      }
    }

    const hit = hitTest(pos);
    if (hit) {
      if (e.shiftKey) {
        if (selectedIds.has(hit.id)) selectedIds.delete(hit.id);
        else selectedIds.add(hit.id);
      } else if (!selectedIds.has(hit.id)) {
        selectedIds = new Set([hit.id]);
      }
      if (selectedIds.has(hit.id)) startMove(pos);
      syncStylePanelFromSelected();
    } else {
      if (!e.shiftKey) selectedIds.clear();
      marqueeState = { start: pos, current: pos };
    }
    redraw();
    return;
  }

  if (currentTool === 'eraser') {
    erasing = true;
    const hit = hitTest(pos);
    if (hit) { elements = elements.filter(e2 => e2.id !== hit.id); redraw(); scheduleSave(); }
    return;
  }

  if (currentTool === 'text') {
    openTextEditor(pos);
    return;
  }

  canvas.setPointerCapture(e.pointerId);
  const base = {
    id: newId(), type: currentTool, angle: 0,
    strokeColor: currentStrokeColor, fillColor: currentFillColor,
    strokeWidth: currentStrokeWidth, opacity: currentOpacity, seed: randomSeed()
  };
  if (currentTool === 'freedraw') draft = { ...base, points: [pos] };
  else if (currentTool === 'line' || currentTool === 'arrow') draft = { ...base, points: [pos, pos] };
  else draft = { ...base, x: pos.x, y: pos.y, width: 0, height: 0 };
  redraw();
});

canvas.addEventListener('pointermove', (e) => {
  if (!drawingMode) return;
  const pos = pointerPos(e);

  if (currentTool === 'eraser' && erasing) {
    const hit = hitTest(pos);
    if (hit) { elements = elements.filter(e2 => e2.id !== hit.id); redraw(); scheduleSave(); }
    return;
  }

  if (currentTool === 'selection') {
    if (resizeState) { applyResize(pos); redraw(); return; }
    if (rotateState) { applyRotate(pos); redraw(); return; }
    if (dragOrigin) { applyMove(pos); redraw(); return; }
    if (marqueeState) {
      marqueeState.current = pos;
      const mRect = {
        x: Math.min(marqueeState.start.x, pos.x), y: Math.min(marqueeState.start.y, pos.y),
        w: Math.abs(pos.x - marqueeState.start.x), h: Math.abs(pos.y - marqueeState.start.y)
      };
      selectedIds = new Set(elements.filter(el => rectsIntersect(mRect, getScreenBBox(el))).map(el => el.id));
      redraw();
    }
    return;
  }

  if (!draft) return;
  if (draft.type === 'freedraw') {
    const last = draft.points[draft.points.length - 1];
    if (distance(pos, last) > 2.5) { draft.points.push(pos); redraw(); }
  } else if (draft.type === 'line' || draft.type === 'arrow') {
    draft.points[1] = pos; redraw();
  } else {
    draft.width = pos.x - draft.x; draft.height = pos.y - draft.y; redraw();
  }
});

function handlePointerUp() {
  if (!drawingMode) return;
  if (currentTool === 'eraser') { erasing = false; return; }

  if (currentTool === 'selection') {
    if (resizeState) { resizeState = null; scheduleSave(); return; }
    if (rotateState) { rotateState = null; scheduleSave(); return; }
    if (dragOrigin) { dragOrigin = null; scheduleSave(); return; }
    if (marqueeState) { marqueeState = null; syncStylePanelFromSelected(); redraw(); return; }
    return;
  }

  if (!draft) return;
  if (['rectangle', 'diamond', 'ellipse'].includes(draft.type) && Math.abs(draft.width) < 3 && Math.abs(draft.height) < 3) {
    draft = null; redraw(); return;
  }
  if (['rectangle', 'diamond', 'ellipse'].includes(draft.type)) {
    const nb = normBox(draft);
    draft.x = nb.x; draft.y = nb.y; draft.width = nb.w; draft.height = nb.h;
  }
  elements.push(draft);
  selectedIds = new Set([draft.id]);
  draft = null;
  setTool('selection');
  syncStylePanelFromSelected();
  redraw();
  scheduleSave();
}

canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerUp);

// --- Text editing overlay ---
function openTextEditor(pos) {
  const input = document.createElement('textarea');
  const fontSize = FONT_SIZE_MAP[currentStrokeWidth] || 20;
  Object.assign(input.style, {
    position: 'fixed', left: pos.x + 'px', top: pos.y + 'px',
    font: fontSize + 'px -apple-system, sans-serif', color: currentStrokeColor,
    background: 'transparent', border: '1px dashed #6965db', outline: 'none',
    resize: 'none', minWidth: '120px', minHeight: (fontSize * 1.4) + 'px',
    zIndex: 25, padding: '2px 4px', lineHeight: '1.2'
  });
  document.body.appendChild(input);
  input.focus();

  function commit() {
    const text = input.value.trim();
    document.body.removeChild(input);
    if (text) {
      const el = {
        id: newId(), type: 'text', angle: 0, x: pos.x, y: pos.y, text,
        strokeColor: currentStrokeColor, strokeWidth: currentStrokeWidth,
        opacity: currentOpacity, seed: randomSeed()
      };
      elements.push(el);
      selectedIds = new Set([el.id]);
      redraw(); scheduleSave();
    }
    setTool('selection');
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; input.blur(); }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); input.blur(); }
  });
}

// --- Mode + tool switching ---
function setDrawingMode(on) {
  drawingMode = on;
  canvas.classList.toggle('drawing', on);
  toolSelector.classList.toggle('hidden', !on);
  stylePanel.classList.toggle('hidden', !on);
  toggleBtn.classList.toggle('hidden', on);
  if (on) setTool('selection');
  else { selectedIds.clear(); redraw(); }
}

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.toolsel').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
}

document.querySelectorAll('.toolsel').forEach(btn => {
  btn.addEventListener('click', () => {
    setTool(btn.dataset.tool);
    if (btn.dataset.tool !== 'selection') selectedIds.clear();
    redraw();
  });
});

toggleBtn.addEventListener('click', () => setDrawingMode(true));
doneBtn.addEventListener('click', () => setDrawingMode(false));

// --- Style panel sync + wiring ---
function syncStrokeSwatches() { strokeSwatches.forEach(s => s.classList.toggle('active', s.dataset.color === currentStrokeColor)); }
function syncFillSwatches() { fillSwatches.forEach(s => s.classList.toggle('active', s.dataset.color === currentFillColor)); }
function syncBgSwatches() { bgSwatches.forEach(s => s.classList.toggle('active', s.dataset.color === backgroundColor)); }
function syncSizeButtons() { sizeButtons.forEach(b => b.classList.toggle('active', Number(b.dataset.size) === currentStrokeWidth)); }
function updateDots() { document.querySelectorAll('.sizebtn .dot').forEach(d => { d.style.background = currentStrokeColor; }); }

function syncAllPanelUI() {
  syncStrokeSwatches(); syncFillSwatches(); syncSizeButtons(); updateDots();
}

// With multiple elements selected and differing styles, this just shows the
// FIRST selected element's values (no "mixed" indicator) — a deliberate
// simplification, not a bug.
function syncStylePanelFromSelected() {
  if (selectedIds.size === 0) return;
  const el = elements.find(e => e.id === [...selectedIds][0]);
  if (!el) return;
  if (el.strokeColor !== undefined) { currentStrokeColor = el.strokeColor; colorPicker.value = el.strokeColor; }
  if (el.fillColor !== undefined) { currentFillColor = el.fillColor; if (el.fillColor !== 'transparent') fillPicker.value = el.fillColor; }
  if (el.strokeWidth !== undefined) currentStrokeWidth = el.strokeWidth;
  if (el.opacity !== undefined) { currentOpacity = el.opacity; opacityPicker.value = el.opacity; }
  syncAllPanelUI();
}

function applyToSelected(prop, value) {
  for (const id of selectedIds) {
    const el = elements.find(e => e.id === id);
    if (el) el[prop] = value;
  }
  redraw();
  scheduleSave();
}

strokeSwatches.forEach(btn => btn.addEventListener('click', () => {
  currentStrokeColor = btn.dataset.color; colorPicker.value = currentStrokeColor;
  syncStrokeSwatches(); updateDots(); applyToSelected('strokeColor', currentStrokeColor);
}));
colorPicker.addEventListener('input', () => {
  currentStrokeColor = colorPicker.value;
  syncStrokeSwatches(); updateDots(); applyToSelected('strokeColor', currentStrokeColor);
});

fillSwatches.forEach(btn => btn.addEventListener('click', () => {
  currentFillColor = btn.dataset.color; syncFillSwatches(); applyToSelected('fillColor', currentFillColor);
}));
fillPicker.addEventListener('input', () => {
  currentFillColor = fillPicker.value; syncFillSwatches(); applyToSelected('fillColor', currentFillColor);
});

sizeButtons.forEach(btn => btn.addEventListener('click', () => {
  currentStrokeWidth = Number(btn.dataset.size); syncSizeButtons(); applyToSelected('strokeWidth', currentStrokeWidth);
}));

opacityPicker.addEventListener('input', () => {
  currentOpacity = Number(opacityPicker.value); applyToSelected('opacity', currentOpacity);
});

bgSwatches.forEach(btn => btn.addEventListener('click', () => {
  setBackground(btn.dataset.color); bgPicker.value = backgroundColor; syncBgSwatches(); scheduleSave();
}));
bgPicker.addEventListener('input', () => {
  setBackground(bgPicker.value); syncBgSwatches(); scheduleSave();
});

// --- Selected-element actions (now loop over the whole set) ---
duplicateBtn.addEventListener('click', () => {
  if (selectedIds.size === 0) return;
  const newIds = [];
  for (const id of selectedIds) {
    const el = elements.find(e => e.id === id);
    if (!el) continue;
    const clone = JSON.parse(JSON.stringify(el));
    clone.id = newId();
    if (clone.points) clone.points = clone.points.map(p => ({ x: p.x + 12, y: p.y + 12 }));
    else { clone.x += 12; clone.y += 12; }
    elements.push(clone);
    newIds.push(clone.id);
  }
  selectedIds = new Set(newIds);
  redraw(); scheduleSave();
});

deleteBtn.addEventListener('click', () => {
  if (selectedIds.size === 0) return;
  elements = elements.filter(e => !selectedIds.has(e.id));
  selectedIds.clear();
  redraw(); scheduleSave();
});

clearBtn.addEventListener('click', () => {
  if (confirm('Clear the whole wallpaper?')) {
    elements = []; selectedIds.clear();
    redraw(); scheduleSave();
  }
});

// --- Keyboard shortcuts ---
window.addEventListener('keydown', (e) => {
  if (!drawingMode) return;
  if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
  const map = { v: 'selection', r: 'rectangle', d: 'diamond', o: 'ellipse', a: 'arrow', l: 'line', p: 'freedraw', t: 'text', e: 'eraser' };
  const key = e.key.toLowerCase();
  if (map[key]) {
    setTool(map[key]);
    if (map[key] !== 'selection') selectedIds.clear();
    redraw();
    return;
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
    elements = elements.filter(e2 => !selectedIds.has(e2.id));
    selectedIds.clear(); redraw(); scheduleSave();
  }
});

// --- Persistence ---
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(save, 300);
}

function save() {
  chrome.storage.local.set({
    wallpaperElements: JSON.stringify(elements),
    wallpaperBackground: backgroundColor
  });
}

function load() {
  chrome.storage.local.get(['wallpaperElements', 'wallpaperBackground'], (result) => {
    if (result.wallpaperElements) {
      try { elements = JSON.parse(result.wallpaperElements); } catch (e) { elements = []; }
    }
    setBackground(result.wallpaperBackground || backgroundColor);
    bgPicker.value = backgroundColor;
    syncBgSwatches();
    syncAllPanelUI();
    resizeCanvas();
  });
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 150);
});

load();