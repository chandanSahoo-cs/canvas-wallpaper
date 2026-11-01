import { StoredAsset } from "../assets/types";

export interface LightboxItem {
  id: string;
  assetId: string;
  elementId?: string;
  caption?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  width?: number;
  height?: number;
}

export interface LightboxState {
  isOpen: boolean;
  items: LightboxItem[];
  currentIndex: number;
  assetDetails: StoredAsset | null;
  imageUrl: string | null;
  isLoading: boolean;
  zoom: number;
  pan: { x: number; y: number };
  toastMessage: string | null;

  // Actions
  open: (items: LightboxItem[], startIndex?: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetTransform: () => void;
  showToast: (msg: string) => void;
}
