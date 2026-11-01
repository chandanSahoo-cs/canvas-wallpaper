import { BackgroundConfig, CanvasElement, ImageElement } from "../elements/types";
import { newId, randomSeed } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";
import { useSceneStore } from "../store/useSceneStore";
import {
  bundleAssets,
  SerializedAssetBundle,
  unpackAndIngestAssets,
} from "../lib/assets";

export interface WallpaperFileData {
  app: "PaperTab";
  version: number;
  schemaVersion?: number;
  name?: string;
  background: BackgroundConfig;
  elements: CanvasElement[];
  embeddedAssets?: Record<string, SerializedAssetBundle>;
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
    const assetId = typeof el.assetId === "string" ? el.assetId : "";
    if (!assetId) return null;
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
      assetId,
      caption: typeof el.caption === "string" ? el.caption.slice(0, 500) : undefined,
      showCaption: Boolean(el.showCaption),
      sourceUrl: typeof el.sourceUrl === "string" ? el.sourceUrl.slice(0, 2000) : undefined,
    } as ImageElement;
  }

  return null;
}

function sanitizeBackground(bg: any): BackgroundConfig {
  if (!bg || typeof bg !== "object") return { type: "color", color: "#14141a" };
  const pattern = ["none", "dots", "grid", "lines"].includes(bg.pattern)
    ? bg.pattern
    : undefined;

  if (bg.type === "image") {
    return {
      type: "image",
      imageAssetId: typeof bg.imageAssetId === "string" ? bg.imageAssetId : undefined,
      color: typeof bg.color === "string" ? bg.color.slice(0, 50) : "#14141a",
      pattern,
    };
  }
  return {
    type: "color",
    color: typeof bg.color === "string" ? bg.color.slice(0, 50) : "#14141a",
    pattern,
  };
}

export async function exportWallpaperFile(sceneName?: string): Promise<void> {
  const { background, elements } = useAppStore.getState();

  // Collect all asset IDs referenced in current wallpaper
  const assetIds = new Set<string>();
  if (background.type === "image" && background.imageAssetId) {
    assetIds.add(background.imageAssetId);
  }
  for (const el of elements) {
    if (el.type === "image" && (el as ImageElement).assetId) {
      assetIds.add((el as ImageElement).assetId);
    }
  }

  // Bundle full resolution assets
  const embeddedAssets = await bundleAssets(assetIds);

  const data: WallpaperFileData = {
    app: "PaperTab",
    version: 3,
    schemaVersion: 2,
    name: sceneName || "My Wallpaper",
    background,
    elements,
    embeddedAssets,
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

export async function importWallpaperFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result as string;
        const data = JSON.parse(raw);
        if (data.elements && Array.isArray(data.elements)) {
          // Ingest and deduplicate embedded assets
          const idMap = await unpackAndIngestAssets(data.embeddedAssets);

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
            const sanitizedBg = sanitizeBackground(data.background);
            if (sanitizedBg.imageAssetId && idMap.has(sanitizedBg.imageAssetId)) {
              sanitizedBg.imageAssetId = idMap.get(sanitizedBg.imageAssetId);
            }
            appStore.setBackground(sanitizedBg);
          }

          const sanitizedElements = data.elements
            .map(sanitizeElement)
            .filter(
              (el: CanvasElement | null): el is CanvasElement => el !== null,
            )
            .map((el: CanvasElement) => {
              if (el.type === "image") {
                const imgEl = el as ImageElement;
                if (idMap.has(imgEl.assetId)) {
                  return { ...imgEl, assetId: idMap.get(imgEl.assetId)! };
                }
              }
              return el;
            });

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
