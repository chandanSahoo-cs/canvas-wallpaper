export interface BackupManifest {
  schemaVersion: number;
  appVersion: string;
  exportedAt: number;
  counts: {
    scenes: number;
    assets: number;
    inbox: number;
  };
}

export interface BackupInspection {
  manifest: BackupManifest;
  fileCount: number;
  totalBytes: number;
  sceneCount: number;
  assetCount: number;
  entries: Map<string, Uint8Array>;
}

export type RestoreMode = "merge" | "replace";

export interface RestoreProgress {
  phase: "reading" | "assets" | "scenes" | "library" | "finalizing";
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export interface RestoreSummary {
  scenesRestored: number;
  assetsImported: number;
  assetsDeduped: number;
  inboxRestored: number;
}
