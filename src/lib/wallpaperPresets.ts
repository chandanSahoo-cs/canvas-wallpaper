import { CanvasElement, BackgroundConfig } from "../elements/types";
import { getDefaultWallpaperElements } from "./defaultWallpaperPreset";

export interface WallpaperPreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  previewBg: string;
  accentColor: string;
  background: BackgroundConfig;
  getElements: (width?: number, height?: number) => CanvasElement[];
}

function getPlayfulDoodlesElements(w?: number, h?: number): CanvasElement[] {
  return getDefaultWallpaperElements(w, h);
}

/**
 * Wallpaper Presets Catalog
 * Features the signature hand-drawn PaperTab artwork preset.
 */
export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "playful-doodles",
    title: "Playful Doodles",
    description: "Hand-drawn friendly dinosaurs, avocado, amoeba, and cosmic doodles.",
    badge: "Signature",
    previewBg: "linear-gradient(135deg, #14141a 0%, #1e1e24 100%)",
    accentColor: "#46BAEB",
    background: {
      type: "color",
      color: "#14141a",
      pattern: "dots",
    },
    getElements: getPlayfulDoodlesElements,
  },
];
