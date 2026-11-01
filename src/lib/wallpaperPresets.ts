import { CanvasElement, BackgroundConfig } from "../elements/types";
import { newId, randomSeed } from "./utils";
import { getDefaultWallpaperElements } from "./defaultWallpaperPreset";

export interface WallpaperPreset {
  id: string;
  title: string;
  description: string;
  category: "Creative" | "Productivity" | "Cosmic" | "Nature" | "Minimal";
  badge: string;
  previewBg: string;
  accentColor: string;
  background: BackgroundConfig;
  getElements: (width?: number, height?: number) => CanvasElement[];
}

function resolveCenter(w?: number, h?: number): { cx: number; cy: number; width: number; height: number } {
  const width =
    typeof w === "number" && w > 0
      ? w
      : typeof window !== "undefined" && window.innerWidth > 0
        ? window.innerWidth
        : 1440;
  const height =
    typeof h === "number" && h > 0
      ? h
      : typeof window !== "undefined" && window.innerHeight > 0
        ? window.innerHeight
        : 800;

  return {
    cx: width / 2,
    cy: height / 2,
    width,
    height,
  };
}

/**
 * 1. Playful Doodles: Signature hand-drawn dinosaurs, avocado, amoeba, and cosmos.
 */
function getPlayfulDoodlesElements(w?: number, h?: number): CanvasElement[] {
  return getDefaultWallpaperElements(w, h);
}

/**
 * 2. Kanban & Focus Board: Structured hand-drawn productivity board with sticky cards and tasks.
 */
function getKanbanBoardElements(w?: number, h?: number): CanvasElement[] {
  const { cx, cy } = resolveCenter(w, h);
  const elements: CanvasElement[] = [];

  // Header Title
  elements.push({
    id: newId(),
    type: "text",
    x: cx - 180,
    y: cy - 230,
    text: "WEEKLY FOCUS & PRIORITIES",
    fontSize: 26,
    fontFamily: "handwritten",
    strokeColor: "#f8fafc",
    fillColor: "transparent",
    strokeWidth: 2,
    opacity: 95,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Header underline accent
  elements.push({
    id: newId(),
    type: "line",
    points: [
      { x: cx - 185, y: cy - 195 },
      { x: cx + 195, y: cy - 195 },
    ],
    strokeColor: "#38bdf8",
    fillColor: "transparent",
    strokeWidth: 2.5,
    roughness: 1.2,
    opacity: 85,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  const columns = [
    {
      title: "TO DO",
      accent: "#38bdf8",
      x: cx - 380,
      cards: [
        { title: "Define sprint roadmap", fill: "#fef08a", stroke: "#ca8a04", y: cy - 90 },
        { title: "Review component specs", fill: "#ede9fe", stroke: "#7c3aed", y: cy - 0 },
      ],
    },
    {
      title: "IN PROGRESS",
      accent: "#f59e0b",
      x: cx - 115,
      cards: [
        { title: "Wallpaper preset gallery", fill: "#fed7aa", stroke: "#ea580c", y: cy - 90 },
        { title: "Canvas gesture interactions", fill: "#e0f2fe", stroke: "#0284c7", y: cy - 0 },
      ],
    },
    {
      title: "COMPLETED",
      accent: "#10b981",
      x: cx + 150,
      cards: [
        { title: "Core hit-testing engine", fill: "#bbf7d0", stroke: "#16a34a", y: cy - 90 },
        { title: "Multi-scene storage sync", fill: "#ccfbf1", stroke: "#0d9488", y: cy - 0 },
      ],
    },
  ];

  for (const col of columns) {
    // Column container frame
    elements.push({
      id: newId(),
      type: "rectangle",
      x: col.x,
      y: cy - 165,
      width: 230,
      height: 350,
      strokeColor: col.accent,
      fillColor: "#1e293b",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1.1,
      opacity: 80,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });

    // Column Header text
    elements.push({
      id: newId(),
      type: "text",
      x: col.x + 20,
      y: cy - 145,
      text: col.title,
      fontSize: 18,
      fontFamily: "handwritten",
      strokeColor: col.accent,
      fillColor: "transparent",
      strokeWidth: 2,
      opacity: 95,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });

    // Header divider line inside column
    elements.push({
      id: newId(),
      type: "line",
      points: [
        { x: col.x + 12, y: cy - 115 },
        { x: col.x + 218, y: cy - 115 },
      ],
      strokeColor: col.accent,
      fillColor: "transparent",
      strokeWidth: 1.5,
      strokeStyle: "dashed",
      roughness: 1.2,
      opacity: 50,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });

    // Sticky Task Cards
    for (const card of col.cards) {
      elements.push({
        id: newId(),
        type: "rectangle",
        x: col.x + 15,
        y: card.y,
        width: 200,
        height: 75,
        strokeColor: card.stroke,
        fillColor: card.fill,
        fillStyle: "solid",
        strokeWidth: 2,
        roughness: 1.4,
        opacity: 90,
        locked: false,
        groupIds: [],
        seed: randomSeed(),
      });

      // Card checklist box
      elements.push({
        id: newId(),
        type: "rectangle",
        x: col.x + 28,
        y: card.y + 16,
        width: 14,
        height: 14,
        strokeColor: "#1e1e24",
        fillColor: "transparent",
        strokeWidth: 1.8,
        roughness: 1.2,
        opacity: 90,
        locked: false,
        groupIds: [],
        seed: randomSeed(),
      });

      // Checkmark in completed column
      if (col.title === "COMPLETED") {
        elements.push({
          id: newId(),
          type: "line",
          points: [
            { x: col.x + 30, y: card.y + 23 },
            { x: col.x + 35, y: card.y + 28 },
            { x: col.x + 44, y: card.y + 16 },
          ],
          strokeColor: "#15803d",
          fillColor: "transparent",
          strokeWidth: 2.5,
          roughness: 0.8,
          opacity: 95,
          locked: false,
          groupIds: [],
          seed: randomSeed(),
        });
      }

      // Card text
      elements.push({
        id: newId(),
        type: "text",
        x: col.x + 50,
        y: card.y + 14,
        text: card.title,
        fontSize: 14,
        fontFamily: "handwritten",
        strokeColor: "#1e1e24",
        fillColor: "transparent",
        strokeWidth: 1.5,
        opacity: 95,
        locked: false,
        groupIds: [],
        seed: randomSeed(),
      });
    }
  }

  return elements;
}

/**
 * 3. Cosmic Orbits: Solar system with concentric orbital paths, glowing sun, planets, and constellations.
 */
function getCosmicOrbitsElements(w?: number, h?: number): CanvasElement[] {
  const { cx, cy } = resolveCenter(w, h);
  const elements: CanvasElement[] = [];

  // Glowing Sun in Center
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx - 45,
    y: cy - 45,
    width: 90,
    height: 90,
    strokeColor: "#f59e0b",
    fillColor: "#fbbf24",
    fillStyle: "solid",
    strokeWidth: 3,
    roughness: 1.4,
    opacity: 95,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Sun Rays
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  for (const deg of rayAngles) {
    const rad = (deg * Math.PI) / 180;
    const r1 = 52;
    const r2 = 68;
    elements.push({
      id: newId(),
      type: "line",
      points: [
        { x: cx + Math.cos(rad) * r1, y: cy + Math.sin(rad) * r1 },
        { x: cx + Math.cos(rad) * r2, y: cy + Math.sin(rad) * r2 },
      ],
      strokeColor: "#f59e0b",
      fillColor: "transparent",
      strokeWidth: 2.2,
      roughness: 1.3,
      opacity: 85,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });
  }

  // 4 Concentric Elliptical Orbit Paths
  const orbits = [
    { rx: 140, ry: 90 },
    { rx: 240, ry: 150 },
    { rx: 350, ry: 220 },
    { rx: 470, ry: 290 },
  ];

  for (const orb of orbits) {
    elements.push({
      id: newId(),
      type: "ellipse",
      x: cx - orb.rx,
      y: cy - orb.ry,
      width: orb.rx * 2,
      height: orb.ry * 2,
      strokeColor: "#475569",
      fillColor: "transparent",
      strokeWidth: 1.5,
      strokeStyle: "dotted",
      roughness: 1.2,
      opacity: 45,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });
  }

  // Planet 1: Mercury (Orbit 1, top right)
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx + 110,
    y: cy - 40,
    width: 16,
    height: 16,
    strokeColor: "#cbd5e1",
    fillColor: "#94a3b8",
    fillStyle: "solid",
    strokeWidth: 1.8,
    roughness: 1.2,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Planet 2: Venus (Orbit 2, bottom left)
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx - 180,
    y: cy + 70,
    width: 24,
    height: 24,
    strokeColor: "#fdba74",
    fillColor: "#f97316",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1.3,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Planet 3: Earth & Moon (Orbit 3, right side)
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx + 290,
    y: cy - 80,
    width: 30,
    height: 30,
    strokeColor: "#38bdf8",
    fillColor: "#0284c7",
    fillStyle: "solid",
    strokeWidth: 2.2,
    roughness: 1.3,
    opacity: 95,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Moon
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx + 335,
    y: cy - 95,
    width: 10,
    height: 10,
    strokeColor: "#f1f5f9",
    fillColor: "#e2e8f0",
    fillStyle: "solid",
    strokeWidth: 1.5,
    roughness: 1.1,
    opacity: 95,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Planet 4: Mars (Orbit 3, bottom right)
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx + 140,
    y: cy + 170,
    width: 22,
    height: 22,
    strokeColor: "#fca5a5",
    fillColor: "#ef4444",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1.3,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Planet 5: Jupiter & Saturn (Orbit 4)
  // Jupiter (top left)
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx - 360,
    y: cy - 150,
    width: 52,
    height: 52,
    strokeColor: "#fde047",
    fillColor: "#eab308",
    fillStyle: "solid",
    strokeWidth: 2.5,
    roughness: 1.4,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Saturn with ring (bottom left)
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx - 280,
    y: cy + 180,
    width: 38,
    height: 38,
    strokeColor: "#fef08a",
    fillColor: "#ca8a04",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1.3,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Saturn ring line
  elements.push({
    id: newId(),
    type: "line",
    points: [
      { x: cx - 315, y: cy + 210 },
      { x: cx - 225, y: cy + 170 },
    ],
    strokeColor: "#fef08a",
    fillColor: "transparent",
    strokeWidth: 3.5,
    roughness: 1.5,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Cosmic Stars (Small diamonds scattered)
  const starCoords = [
    { x: cx - 440, y: cy - 240 },
    { x: cx - 210, y: cy - 260 },
    { x: cx + 70, y: cy - 250 },
    { x: cx + 380, y: cy - 230 },
    { x: cx + 460, y: cy + 40 },
    { x: cx + 380, y: cy + 200 },
    { x: cx - 430, y: cy + 120 },
    { x: cx - 120, y: cy + 270 },
  ];

  for (const s of starCoords) {
    elements.push({
      id: newId(),
      type: "diamond",
      x: s.x,
      y: s.y,
      width: 10,
      height: 10,
      strokeColor: "#f8fafc",
      fillColor: "#ffffff",
      fillStyle: "solid",
      strokeWidth: 1.5,
      roughness: 1.1,
      opacity: 85,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });
  }

  // Latin Motto at bottom
  elements.push({
    id: newId(),
    type: "text",
    x: cx - 120,
    y: cy + 280,
    text: "PER ASPERA AD ASTRA",
    fontSize: 18,
    fontFamily: "handwritten",
    strokeColor: "#94a3b8",
    fillColor: "transparent",
    strokeWidth: 1.5,
    opacity: 80,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  return elements;
}

/**
 * 4. Zen Mountains: Tranquil mountain landscape, rising sun, and soaring birds.
 */
function getZenMountainsElements(w?: number, h?: number): CanvasElement[] {
  const { cx, cy } = resolveCenter(w, h);
  const elements: CanvasElement[] = [];

  // Rising Crimson Sun
  elements.push({
    id: newId(),
    type: "ellipse",
    x: cx - 80,
    y: cy - 140,
    width: 160,
    height: 160,
    strokeColor: "#e11d48",
    fillColor: "#f43f5e",
    fillStyle: "solid",
    strokeWidth: 3,
    roughness: 1.4,
    opacity: 85,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Layer 1: Background Mountains (soft slate)
  const bgPeak1: CanvasElement = {
    id: newId(),
    type: "line",
    points: [
      { x: cx - 460, y: cy + 120 },
      { x: cx - 250, y: cy - 50 },
      { x: cx - 50, y: cy + 120 },
    ],
    strokeColor: "#475569",
    fillColor: "transparent",
    strokeWidth: 2.5,
    roughness: 1.4,
    opacity: 75,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  };

  const bgPeak2: CanvasElement = {
    id: newId(),
    type: "line",
    points: [
      { x: cx - 120, y: cy + 120 },
      { x: cx + 110, y: cy - 80 },
      { x: cx + 320, y: cy + 120 },
    ],
    strokeColor: "#475569",
    fillColor: "transparent",
    strokeWidth: 2.5,
    roughness: 1.4,
    opacity: 75,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  };

  const bgPeak3: CanvasElement = {
    id: newId(),
    type: "line",
    points: [
      { x: cx + 220, y: cy + 120 },
      { x: cx + 380, y: cy - 20 },
      { x: cx + 520, y: cy + 120 },
    ],
    strokeColor: "#475569",
    fillColor: "transparent",
    strokeWidth: 2.5,
    roughness: 1.4,
    opacity: 75,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  };

  elements.push(bgPeak1, bgPeak2, bgPeak3);

  // Layer 2: Foreground Mountains (sharp charcoal peaks)
  const fgPeak1: CanvasElement = {
    id: newId(),
    type: "line",
    points: [
      { x: cx - 350, y: cy + 120 },
      { x: cx - 160, y: cy + 10 },
      { x: cx + 20, y: cy + 120 },
    ],
    strokeColor: "#94a3b8",
    fillColor: "transparent",
    strokeWidth: 3,
    roughness: 1.5,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  };

  const fgPeak2: CanvasElement = {
    id: newId(),
    type: "line",
    points: [
      { x: cx - 40, y: cy + 120 },
      { x: cx + 180, y: cy - 10 },
      { x: cx + 400, y: cy + 120 },
    ],
    strokeColor: "#94a3b8",
    fillColor: "transparent",
    strokeWidth: 3,
    roughness: 1.5,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  };

  elements.push(fgPeak1, fgPeak2);

  // Horizontal Ground Line
  elements.push({
    id: newId(),
    type: "line",
    points: [
      { x: cx - 520, y: cy + 120 },
      { x: cx + 520, y: cy + 120 },
    ],
    strokeColor: "#cbd5e1",
    fillColor: "transparent",
    strokeWidth: 2.8,
    roughness: 1.2,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Flying Birds in Sky
  const birdOffsets = [
    { x: cx - 220, y: cy - 200 },
    { x: cx - 180, y: cy - 220 },
    { x: cx - 140, y: cy - 190 },
    { x: cx - 100, y: cy - 230 },
    { x: cx - 60, y: cy - 205 },
  ];

  for (const b of birdOffsets) {
    elements.push({
      id: newId(),
      type: "line",
      points: [
        { x: b.x - 10, y: b.y + 4 },
        { x: b.x, y: b.y },
        { x: b.x + 10, y: b.y + 4 },
      ],
      strokeColor: "#f1f5f9",
      fillColor: "transparent",
      strokeWidth: 2.2,
      roughness: 1.1,
      opacity: 85,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });
  }

  // Zen Inscription
  elements.push({
    id: newId(),
    type: "text",
    x: cx - 140,
    y: cy + 160,
    text: "Still waters run deep",
    fontSize: 22,
    fontFamily: "handwritten",
    strokeColor: "#94a3b8",
    fillColor: "transparent",
    strokeWidth: 1.8,
    opacity: 85,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  return elements;
}

/**
 * 5. Blueprint Architecture: Clean draft frame with technical specs and grid canvas.
 */
function getBlueprintElements(w?: number, h?: number): CanvasElement[] {
  const { cx, cy } = resolveCenter(w, h);
  const elements: CanvasElement[] = [];

  // Outer Technical Frame
  elements.push({
    id: newId(),
    type: "rectangle",
    x: cx - 440,
    y: cy - 260,
    width: 880,
    height: 520,
    strokeColor: "#38bdf8",
    fillColor: "transparent",
    strokeWidth: 2,
    roughness: 0.6,
    opacity: 70,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  // Corner Marks (Crosshairs)
  const corners = [
    { x: cx - 440, y: cy - 260 },
    { x: cx + 440, y: cy - 260 },
    { x: cx - 440, y: cy + 260 },
    { x: cx + 440, y: cy + 260 },
  ];

  for (const c of corners) {
    elements.push({
      id: newId(),
      type: "line",
      points: [
        { x: c.x - 14, y: c.y },
        { x: c.x + 14, y: c.y },
      ],
      strokeColor: "#38bdf8",
      fillColor: "transparent",
      strokeWidth: 1.8,
      opacity: 85,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });
    elements.push({
      id: newId(),
      type: "line",
      points: [
        { x: c.x, y: c.y - 14 },
        { x: c.x, y: c.y + 14 },
      ],
      strokeColor: "#38bdf8",
      fillColor: "transparent",
      strokeWidth: 1.8,
      opacity: 85,
      locked: false,
      groupIds: [],
      seed: randomSeed(),
    });
  }

  // Title Block in Bottom Right Corner
  elements.push({
    id: newId(),
    type: "rectangle",
    x: cx + 180,
    y: cy + 160,
    width: 240,
    height: 85,
    strokeColor: "#38bdf8",
    fillColor: "#1e293b",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 0.8,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  elements.push({
    id: newId(),
    type: "text",
    x: cx + 195,
    y: cy + 172,
    text: "PROJECT: PAPERTAB",
    fontSize: 16,
    fontFamily: "monospace",
    strokeColor: "#38bdf8",
    fillColor: "transparent",
    strokeWidth: 1.8,
    opacity: 95,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  elements.push({
    id: newId(),
    type: "text",
    x: cx + 195,
    y: cy + 198,
    text: "SHEET: 01 // ARCHITECTURE",
    fontSize: 12,
    fontFamily: "monospace",
    strokeColor: "#94a3b8",
    fillColor: "transparent",
    strokeWidth: 1.5,
    opacity: 85,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  elements.push({
    id: newId(),
    type: "text",
    x: cx + 195,
    y: cy + 220,
    text: "STATUS: READY FOR IDEAS",
    fontSize: 12,
    fontFamily: "monospace",
    strokeColor: "#34d399",
    fillColor: "transparent",
    strokeWidth: 1.5,
    opacity: 90,
    locked: false,
    groupIds: [],
    seed: randomSeed(),
  });

  return elements;
}

/**
 * Wallpaper Presets Catalog
 */
export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "playful-doodles",
    title: "Playful Doodles",
    description: "Hand-drawn friendly dinosaurs, avocado, amoeba, and cosmic doodles.",
    category: "Creative",
    badge: "Signature",
    previewBg: "linear-gradient(135deg, #14141a 0%, #1e1e24 100%)",
    accentColor: "#38bdf8",
    background: {
      type: "color",
      color: "#14141a",
      pattern: "dots",
    },
    getElements: getPlayfulDoodlesElements,
  },
  {
    id: "kanban-focus",
    title: "Kanban & Focus",
    description: "Productivity workflow with To Do, In Progress, and Done task cards.",
    category: "Productivity",
    badge: "Workflow",
    previewBg: "linear-gradient(135deg, #181820 0%, #0f172a 100%)",
    accentColor: "#f59e0b",
    background: {
      type: "color",
      color: "#181820",
      pattern: "grid",
    },
    getElements: getKanbanBoardElements,
  },
  {
    id: "cosmic-orbits",
    title: "Cosmic Orbits",
    description: "A hand-drawn solar system with glowing sun, orbital paths, and planets.",
    category: "Cosmic",
    badge: "Space",
    previewBg: "linear-gradient(135deg, #0b132b 0%, #1c2541 100%)",
    accentColor: "#fbbf24",
    background: {
      type: "color",
      color: "#0b132b",
      pattern: "dots",
    },
    getElements: getCosmicOrbitsElements,
  },
  {
    id: "zen-mountains",
    title: "Zen Mountains",
    description: "Serene mountain ridges, rising crimson sun, and soaring birds in flight.",
    category: "Nature",
    badge: "Serene",
    previewBg: "linear-gradient(135deg, #1e1e24 0%, #292524 100%)",
    accentColor: "#f43f5e",
    background: {
      type: "color",
      color: "#1e1e24",
      pattern: "none",
    },
    getElements: getZenMountainsElements,
  },
  {
    id: "grid-blueprint",
    title: "Blueprint Drafting",
    description: "Technical drafting frame with corner crosshairs and project title block.",
    category: "Minimal",
    badge: "Technical",
    previewBg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    accentColor: "#38bdf8",
    background: {
      type: "color",
      color: "#0f172a",
      pattern: "grid",
    },
    getElements: getBlueprintElements,
  },
];
