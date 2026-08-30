const canvas = document.getElementById("wallpaper");
const ctx = canvas.getContext("2d");
const toggleBtn = document.getElementById("toggleBtn");
const toolbar = document.getElementById("toolbar");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");
const bgPicker = document.getElementById("bgPicker");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const doneBtn = document.getElementById("doneBtn");

let strokes = [];
let currentStroke = null;
let drawingMode = false;
let isEraser = false;
let backgroundColor = "#14141a";
let saveTimeout = null;
let resizeTimeout = null;

// --- Canvas sizing ---
// The canvas itself stays transparent. The "background" is just the page's
// own background color, so an eraser stroke (destination-out) naturally
// reveals it again instead of punching a mismatched hole.
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redraw();
}

function setBackground(color) {
  backgroundColor = color;
  document.body.style.background = color;
}

// --- Rendering ---
function redraw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

  for (const stroke of allStrokes) {
    const pts = stroke.points;
    if (pts.length < 1) continue;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke.color;
    ctx.globalCompositeOperation = stroke.eraser
      ? "destination-out"
      : "source-over";

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    if (pts.length === 1) {
      // Single click with no drag: draw a dot.
      ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
    } else {
      // Smooth the sparse recorded points with quadratic curves.
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

  ctx.globalCompositeOperation = "source-over";
}

// --- Pointer handling ---
function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

canvas.addEventListener("pointerdown", (e) => {
  if (!drawingMode) return;
  canvas.setPointerCapture(e.pointerId);
  currentStroke = {
    points: [pointerPos(e)],
    color: colorPicker.value,
    width: Number(sizePicker.value),
    eraser: isEraser,
  };
  redraw();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawingMode || !currentStroke) return;
  const pos = pointerPos(e);
  const last = currentStroke.points[currentStroke.points.length - 1];
  // Only record a point if it moved enough — keeps stored data small.
  if (distance(pos, last) > 2.5) {
    currentStroke.points.push(pos);
    redraw();
  }
});

function endStroke() {
  if (!currentStroke) return;
  strokes.push(currentStroke);
  currentStroke = null;
  redraw();
  scheduleSave();
}

canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);

// --- Mode toggle ---
toggleBtn.addEventListener("click", () => {
  drawingMode = !drawingMode;
  canvas.classList.toggle("drawing", drawingMode);
  toolbar.classList.toggle("hidden", !drawingMode);
  toggleBtn.innerHTML = drawingMode
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-off-icon lucide-pencil-off"><path d="m10 10-6.157 6.162a2 2 0 0 0-.5.833l-1.322 4.36a.5.5 0 0 0 .622.624l4.358-1.323a2 2 0 0 0 .83-.5L14 13.982"/><path d="m12.829 7.172 4.359-4.346a1 1 0 1 1 3.986 3.986l-4.353 4.353"/><path d="m15 5 4 4"/><path d="m2 2 20 20"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M13 21h8"/><path d="m15 5 4 4"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>';
});

doneBtn.addEventListener("click", () => toggleBtn.click());

// --- Toolbar controls ---
eraserBtn.addEventListener("click", () => {
  isEraser = !isEraser;
  eraserBtn.classList.toggle("active", isEraser);
});

undoBtn.addEventListener("click", () => {
  strokes.pop();
  redraw();
  scheduleSave();
});

clearBtn.addEventListener("click", () => {
  if (confirm("Clear the whole wallpaper?")) {
    strokes = [];
    redraw();
    scheduleSave();
  }
});

bgPicker.addEventListener("input", () => {
  setBackground(bgPicker.value);
  scheduleSave();
});

// --- Persistence ---
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(save, 300);
}

function save() {
  chrome.storage.local.set({
    wallpaperStrokes: JSON.stringify(strokes),
    wallpaperBackground: backgroundColor,
  });
}

function load() {
  chrome.storage.local.get(
    ["wallpaperStrokes", "wallpaperBackground"],
    (result) => {
      if (result.wallpaperStrokes) {
        try {
          strokes = JSON.parse(result.wallpaperStrokes);
        } catch (e) {
          strokes = [];
        }
      }
      setBackground(result.wallpaperBackground || backgroundColor);
      bgPicker.value = backgroundColor;
      resizeCanvas();
    },
  );
}

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 150);
});

load();
