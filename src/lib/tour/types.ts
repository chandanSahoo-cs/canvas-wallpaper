import { TourPlacement } from "./positioning";

export interface TourStepConfig {
  id: string;
  chapterId: string;
  targetSelector: string;
  badge: string;
  title: string;
  description: string;
  placement: TourPlacement;
  targetMode?: "wallpaper" | "drawing";
  waitFor?: string;
  optional?: boolean;
  onEnter?: () => void | Promise<void>;
  onExit?: () => void | Promise<void>;
}

export interface ChapterInfo {
  id: string;
  title: string;
  badge: string;
  description: string;
  estimatedSeconds: number;
}
