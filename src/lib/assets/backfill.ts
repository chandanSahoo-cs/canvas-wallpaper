import { getAllAssets, saveAsset } from "./db";
import { extractAssetMetadataFromBlob } from "./metadata";
import { StoredAsset } from "./types";

export interface BackfillProgress {
  isBackfilling: boolean;
  isPaused: boolean;
  total: number;
  processed: number;
  currentAssetId?: string;
}

type ProgressListener = (progress: BackfillProgress) => void;

class AssetBackfillManager {
  private listeners = new Set<ProgressListener>();
  private isRunning = false;
  private isCancelled = false;
  private isPaused = false;
  private pendingQueue: StoredAsset[] = [];
  private total = 0;
  private processed = 0;
  private currentTimeout: any = null;

  public getProgress(): BackfillProgress {
    return {
      isBackfilling: this.isRunning && !this.isPaused,
      isPaused: this.isPaused,
      total: this.total,
      processed: this.processed,
      currentAssetId: this.pendingQueue[0]?.id,
    };
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.getProgress());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const progress = this.getProgress();
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch {}
    }
  }

  /**
   * Scans all stored assets and enqueues any that lack palette, phash, or tags.
   */
  public async scanAndStart(): Promise<void> {
    if (this.isRunning) return;

    try {
      const allAssets = await getAllAssets();
      const needsBackfill = allAssets.filter((a) => {
        const missingPalette = !a.palette || a.palette.length === 0;
        const missingPhash = !a.phash || a.phash === "0000000000000000";
        const missingTags = !Array.isArray(a.tags);
        return missingPalette || missingPhash || missingTags;
      });

      if (needsBackfill.length === 0) {
        this.total = 0;
        this.processed = 0;
        this.notify();
        return;
      }

      this.pendingQueue = needsBackfill;
      this.total = needsBackfill.length;
      this.processed = 0;
      this.isRunning = true;
      this.isCancelled = false;
      this.isPaused = false;
      this.notify();

      this.scheduleNext();
    } catch (err) {
      console.warn("Backfill scan failed:", err);
      this.isRunning = false;
      this.notify();
    }
  }

  public pause(): void {
    this.isPaused = true;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.notify();
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.notify();
    this.scheduleNext();
  }

  public cancel(): void {
    this.isCancelled = true;
    this.isRunning = false;
    this.isPaused = false;
    this.pendingQueue = [];
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.notify();
  }

  private scheduleNext(): void {
    if (this.isCancelled || this.isPaused || this.pendingQueue.length === 0) {
      this.isRunning = false;
      this.currentTimeout = null;
      this.notify();
      return;
    }

    // Process during idle periods with a short breather to prevent UI hitching
    const runner = async () => {
      if (this.isCancelled || this.isPaused) return;
      const asset = this.pendingQueue.shift();
      if (!asset) {
        this.isRunning = false;
        this.notify();
        return;
      }

      try {
        const blobToExamine = asset.thumbBlob || asset.blob;
        const meta = await extractAssetMetadataFromBlob(blobToExamine);

        asset.palette = asset.palette && asset.palette.length > 0 ? asset.palette : meta.palette;
        asset.phash = asset.phash && asset.phash !== "0000000000000000" ? asset.phash : meta.phash;
        asset.tags = Array.isArray(asset.tags) ? asset.tags : [];

        await saveAsset(asset);
      } catch (err) {
        console.warn(`Failed to backfill asset ${asset.id}:`, err);
      } finally {
        this.processed++;
        this.notify();
        this.scheduleNext();
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      this.currentTimeout = requestIdleCallback(() => runner(), { timeout: 100 });
    } else {
      this.currentTimeout = setTimeout(runner, 25);
    }
  }
}

export const backfillManager = new AssetBackfillManager();
