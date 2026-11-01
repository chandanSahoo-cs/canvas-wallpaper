export type ResurfaceMode = "current" | "shuffle" | "random_item" | "daily";
export type ResurfaceFit = "cover" | "contain";

export interface ResurfaceConfig {
  mode: ResurfaceMode;
  fit: ResurfaceFit;
  showCaption: boolean;
  exclusions: string[]; // Board IDs or item IDs marked "Never show again"
  lastShownId?: string; // Avoid immediate repeats
}

export interface ResurfaceItem {
  id: string;
  assetId: string;
  title?: string;
  caption?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  width?: number;
  height?: number;
}

export interface ResurfaceIndex {
  boardIds: string[];
  boardNames: Record<string, string>;
  items: ResurfaceItem[];
  updatedAt: number;
}

export type ResurfacePickType = "board" | "item";

export interface ResurfacePick {
  mode: ResurfaceMode;
  type: ResurfacePickType;
  id: string;
  boardId?: string;
  item?: ResurfaceItem;
}

export const RESURFACE_CONFIG_KEY = "papertab_resurface_config";
export const RESURFACE_INDEX_KEY = "papertab_resurface_index";
