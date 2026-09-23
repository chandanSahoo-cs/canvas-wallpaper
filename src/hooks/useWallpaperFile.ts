import { BackgroundConfig, CanvasElement } from "../elements/types";
import { newId, randomSeed } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";
import { useSceneStore } from "../store/useSceneStore";

export interface WallpaperFileData {
  app: "PaperTab";
  version: number;
  name?: string;
  background: BackgroundConfig;
  elements: CanvasElement[];
  exportedAt: number;
}

function sanitizeElement(el: any): CanvasElement | null {
  if (!el || typeof el !== "object" || typeof el.type !== "string") return null;
  const validTypes = [
    "rectangle",
    "diamond",
    "ellipse",
    "line",
    "arrow",
    "freedraw",
    "text",
    "image",
  ];
  if (!validTypes.includes(el.type)) return null;

  const base = {
    id: typeof el.id === "string" && el.id ? el.id : newId(),
    type: el.type,
    strokeColor:
      typeof el.strokeColor === "string"
        ? el.strokeColor.slice(0, 50)
        : "#ffffff",
    fillColor:
      typeof el.fillColor === "string"
        ? el.fillColor.slice(0, 50)
        : "transparent",
    fillStyle: ["solid", "hachure", "cross-hatch"].includes(el.fillStyle)
      ? el.fillStyle
      : "solid",
    strokeWidth:
      typeof el.strokeWidth === "number" && Number.isFinite(el.strokeWidth)
        ? Math.max(0.5, Math.min(50, el.strokeWidth))
        : 1.5,
    strokeStyle: ["solid", "dashed", "dotted"].includes(el.strokeStyle)
      ? el.strokeStyle
      : "solid",
    roughness:
      typeof el.roughness === "number" && Number.isFinite(el.roughness)
        ? Math.max(0, Math.min(5, el.roughness))
        : 1.4,
    opacity:
      typeof el.opacity === "number" && Number.isFinite(el.opacity)
        ? Math.max(0, Math.min(100, el.opacity))
        : 100,
    locked: Boolean(el.locked),
    angle:
      typeof el.angle === "number" && Number.isFinite(el.angle) ? el.angle : 0,
    groupIds: Array.isArray(el.groupIds)
      ? el.groupIds.filter((g: any) => typeof g === "string")
      : [],
    seed:
      typeof el.seed === "number" && Number.isFinite(el.seed)
        ? el.seed
        : randomSeed(),
  };

  if (["rectangle", "diamond", "ellipse"].includes(el.type)) {
    return {
      ...base,
      x: typeof el.x === "number" && Number.isFinite(el.x) ? el.x : 0,
      y: typeof el.y === "number" && Number.isFinite(el.y) ? el.y : 0,
      width:
        typeof el.width === "number" && Number.isFinite(el.width)
          ? el.width
          : 50,
      height:
        typeof el.height === "number" && Number.isFinite(el.height)
          ? el.height
          : 50,
    } as CanvasElement;
  }

  if (["line", "arrow", "freedraw"].includes(el.type)) {
    const points = Array.isArray(el.points)
      ? el.points
          .filter(
            (p: any) =>
              p &&
              typeof p.x === "number" &&
              typeof p.y === "number" &&
              Number.isFinite(p.x) &&
              Number.isFinite(p.y),
          )
          .map((p: any) => ({ x: p.x, y: p.y }))
      : [];
    if (points.length === 0) return null;
    return {
      ...base,
      points,
    } as CanvasElement;
  }

  if (el.type === "text") {
    return {
      ...base,
      x: typeof el.x === "number" && Number.isFinite(el.x) ? el.x : 0,
      y: typeof el.y === "number" && Number.isFinite(el.y) ? el.y : 0,
      text: typeof el.text === "string" ? el.text.slice(0, 50000) : "",
      fontSize:
        typeof el.fontSize === "number" && Number.isFinite(el.fontSize)
          ? Math.max(8, Math.min(200, el.fontSize))
          : 20,
      fontFamily: ["handwritten", "sans", "monospace"].includes(el.fontFamily)
        ? el.fontFamily
        : "handwritten",
    } as CanvasElement;
  }

  if (el.type === "image") {
    const dataUrl =
      typeof el.dataUrl === "string" &&
      (el.dataUrl.startsWith("data:image/") ||
        el.dataUrl.startsWith("https://"))
        ? el.dataUrl
        : "";
    if (!dataUrl) return null;
    return {
      ...base,
      x: typeof el.x === "number" && Number.isFinite(el.x) ? el.x : 0,
      y: typeof el.y === "number" && Number.isFinite(el.y) ? el.y : 0,
      width:
        typeof el.width === "number" && Number.isFinite(el.width)
          ? Math.max(1, el.width)
          : 100,
      height:
        typeof el.height === "number" && Number.isFinite(el.height)
          ? Math.max(1, el.height)
          : 100,
      dataUrl,
    } as CanvasElement;
  }

  return null;
}

function sanitizeBackground(bg: any): BackgroundConfig {
  if (!bg || typeof bg !== "object") return { type: "color", color: "#14141a" };
  if (bg.type === "image") {
    const imageUrl =
      typeof bg.imageUrl === "string" &&
      (bg.imageUrl.startsWith("data:image/") ||
        bg.imageUrl.startsWith("https://"))
        ? bg.imageUrl
        : "";
    return {
      type: "image",
      imageUrl,
      color: typeof bg.color === "string" ? bg.color.slice(0, 50) : "#14141a",
    };
  }
  return {
    type: "color",
    color: typeof bg.color === "string" ? bg.color.slice(0, 50) : "#14141a",
  };
}

export function exportWallpaperFile(sceneName?: string) {
  const { background, elements } = useAppStore.getState();
  const data: WallpaperFileData = {
    app: "PaperTab",
    version: 2,
    name: sceneName || "My Wallpaper",
    background,
    elements,
    exportedAt: Date.now(),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = (sceneName || "wallpaper")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");
  a.download = `${fileName}.canvaswallpaper`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importWallpaperFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const data = JSON.parse(raw);
        if (data.elements && Array.isArray(data.elements)) {
          const appStore = useAppStore.getState();
          const sceneStore = useSceneStore.getState();
          appStore.pushHistory();

          if (typeof data.name === "string" && data.name.trim()) {
            sceneStore.renameScene(
              sceneStore.activeSceneId,
              data.name.trim().slice(0, 50),
            );
          }
          if (data.background) {
            appStore.setBackground(sanitizeBackground(data.background));
          }

          const sanitizedElements = data.elements
            .map(sanitizeElement)
            .filter(
              (el: CanvasElement | null): el is CanvasElement => el !== null,
            );

          appStore.setElements(sanitizedElements);
          appStore.saveToStorage();
          resolve(true);
          return;
        }
      } catch (err) {
        console.error("Import error:", err);
      }
      resolve(false);
    };
    reader.readAsText(file);
  });
}
