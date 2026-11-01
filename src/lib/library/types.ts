import { PaletteColor, StoredAsset } from "../assets/types";

export type LibrarySortBy = "newest" | "oldest" | "size" | "hue";

export type LibraryItemType = "image" | "text";

export interface BoardPlacement {
  sceneId: string;
  sceneName: string;
  elementId?: string;
  caption?: string;
}

export interface LibraryItem {
  id: string;
  type: LibraryItemType;
  title: string;
  createdAt: number;
  // Image-specific
  assetId?: string;
  thumbBlob?: Blob;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  tags: string[];
  note?: string;
  palette: PaletteColor[];
  phash?: string;
  labelColor?: string;
  sourceUrl?: string;
  // Text-specific
  textContent?: string;
  fontFamily?: string;
  // Board references
  placements: BoardPlacement[];
}

export interface LibraryFilters {
  query?: string;
  tag?: string;
  boardId?: string;
  type?: "all" | "image" | "text";
  colorHex?: string;
  colorTolerance?: number; // 0.05 to 0.40 in OKLab
  dateRange?: "all" | "today" | "week" | "month";
  unplacedOnly?: boolean;
  duplicatesOnly?: boolean;
}
