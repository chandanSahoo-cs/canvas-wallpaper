import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Upload,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FileCheck,
} from "lucide-react";
import {
  exportEverything,
  ExportProgress,
} from "../../lib/backup/export";
import {
  inspectBackupZip,
  restoreBackup,
} from "../../lib/backup/import";
import {
  BackupInspection,
  RestoreMode,
  RestoreProgress,
  RestoreSummary,
} from "../../lib/backup/types";
import { formatBytes, cn } from "../../lib/utils";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null,
  );
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Import inspection state
  const [inspection, setInspection] = useState<BackupInspection | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>("merge");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] =
    useState<RestoreProgress | null>(null);
  const [restoreSummary, setRestoreSummary] =
    useState<RestoreSummary | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const result = await exportEverything((prog) => {
        setExportProgress(prog);
      });
      if (result.success) {
        setExportMessage(`Export complete! Saved as ${result.filename}`);
      }
    } catch (err: any) {
      setExportMessage(`Export failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInspectError(null);
    setInspection(null);
    setRestoreSummary(null);

    try {
      const res = await inspectBackupZip(file);
      setInspection(res);
    } catch (err: any) {
      setInspectError(err.message || "Failed to inspect backup archive");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmRestore = async () => {
    if (!inspection) return;
    setIsRestoring(true);
    setInspectError(null);

    try {
      const summary = await restoreBackup(inspection, restoreMode, (prog) => {
        setRestoreProgress(prog);
      });
      setRestoreSummary(summary);
      setInspection(null);
    } catch (err: any) {
      setInspectError(`Restore failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsRestoring(false);
      setRestoreProgress(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      className="fixed inset-0 z-50 bg-[#0E1A1F]/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="bg-surface text-ink border-2 border-line rounded-sk-lg p-6 w-full max-w-lg shadow-hard flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-line">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-brand-blue" />
            <h2
              id="backup-modal-title"
              className="font-hand text-lg font-bold text-ink"
            >
              Backup & Restore
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close backup modal"
            className="p-1 rounded-sk-sm hover:bg-paper text-ink/70 hover:text-ink cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Section */}
        <div className="p-4 rounded-sk bg-paper border-2 border-line/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-hand font-bold text-sm text-ink">
                Export Collection (.zip)
              </div>
              <div className="text-xs font-sans text-muted">
                Produces self-contained archive with full-res originals, boards,
                and metadata.
              </div>
            </div>
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-sk bg-brand-green text-on-accent border-2 border-line font-hand font-bold text-xs shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? "Exporting..." : "Export"}</span>
            </button>
          </div>

          {/* Export Progress */}
          {exportProgress && (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between text-xs font-hand font-bold text-ink">
                <span>{exportProgress.message}</span>
                <span>{exportProgress.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-surface rounded-sk-sm overflow-hidden border border-line/30">
                <div
                  className="h-full bg-brand-green transition-all duration-150"
                  style={{ width: `${exportProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {exportMessage && (
            <div className="text-xs font-hand font-bold text-brand-blue">
              {exportMessage}
            </div>
          )}
        </div>

        {/* Import Section */}
        <div className="p-4 rounded-sk bg-paper border-2 border-line/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-hand font-bold text-sm text-ink">
                Restore from Backup (.zip)
              </div>
              <div className="text-xs font-sans text-muted">
                Restore boards and assets from a previously exported ZIP archive.
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="px-3.5 py-1.5 rounded-sk bg-surface hover:bg-paper text-ink border-2 border-line font-hand font-bold text-xs shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-brand-blue" />
              <span>Select ZIP</span>
            </button>
          </div>

          {inspectError && (
            <div className="p-2.5 rounded-sk bg-danger/10 border border-danger/30 text-danger text-xs font-hand font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{inspectError}</span>
            </div>
          )}

          {/* Restore Success Summary */}
          {restoreSummary && (
            <div className="p-3 rounded-sk bg-brand-green/10 border-2 border-brand-green text-ink flex flex-col gap-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-hand font-bold text-sm text-brand-green">
                <CheckCircle2 className="w-4 h-4" />
                <span>Restore Completed Successfully</span>
              </div>
              <div className="text-xs font-mono text-ink/80 flex flex-wrap gap-x-3 gap-y-1">
                <span>Boards: {restoreSummary.scenesRestored}</span>
                <span>Assets: {restoreSummary.assetsImported} imported</span>
                <span>({restoreSummary.assetsDeduped} deduped)</span>
                <span>Inbox: {restoreSummary.inboxRestored}</span>
              </div>
            </div>
          )}

          {/* Inspection Details & Mode Choice */}
          {inspection && !restoreSummary && (
            <div className="mt-2 p-3 rounded-sk bg-surface border-2 border-line flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-hand font-bold text-ink">
                <FileCheck className="w-4 h-4 text-brand-blue" />
                <span>Backup Verified (v{inspection.manifest.schemaVersion})</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-paper p-2 rounded-sk border border-line/20">
                <div>Boards: {inspection.sceneCount}</div>
                <div>Assets: {inspection.assetCount}</div>
                <div>Files: {inspection.fileCount}</div>
                <div>Size: {formatBytes(inspection.totalBytes)}</div>
              </div>

              {/* Merge vs Replace selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-hand font-bold text-ink">
                  Restore Action:
                </span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-paper border-2 border-line rounded-sk">
                  <button
                    type="button"
                    onClick={() => setRestoreMode("merge")}
                    className={cn(
                      "py-1.5 px-2 rounded-sk-sm text-xs font-hand font-bold transition-all cursor-pointer border-2",
                      restoreMode === "merge"
                        ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                        : "border-transparent text-ink/70 hover:text-ink",
                    )}
                  >
                    Merge (Safe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreMode("replace")}
                    className={cn(
                      "py-1.5 px-2 rounded-sk-sm text-xs font-hand font-bold transition-all cursor-pointer border-2",
                      restoreMode === "replace"
                        ? "bg-danger text-white border-line shadow-hard-sm"
                        : "border-transparent text-ink/70 hover:text-ink",
                    )}
                  >
                    Replace All
                  </button>
                </div>
              </div>

              {restoreMode === "replace" ? (
                <div className="p-2 rounded-sk bg-danger/10 border border-danger/40 text-danger text-[11px] font-sans flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: Replace will wipe your current boards and inbox
                    before restoring this backup. This cannot be undone.
                  </span>
                </div>
              ) : (
                <div className="text-[11px] font-sans text-muted">
                  Merge keeps existing boards intact and skips duplicate images
                  by SHA-256 hash.
                </div>
              )}

              {/* Restore Progress */}
              {restoreProgress && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-hand font-bold text-ink">
                    <span>{restoreProgress.message}</span>
                    <span>{restoreProgress.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-paper rounded-sk-sm overflow-hidden border border-line/30">
                    <div
                      className="h-full bg-brand-blue transition-all duration-150"
                      style={{ width: `${restoreProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setInspection(null)}
                  disabled={isRestoring}
                  className="px-3 py-1.5 rounded-sk bg-paper text-ink font-hand font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className={cn(
                    "px-4 py-1.5 rounded-sk font-hand font-bold text-xs border-2 border-line shadow-hard-sm cursor-pointer disabled:opacity-50",
                    restoreMode === "replace"
                      ? "bg-danger text-white hover:brightness-105"
                      : "bg-brand-green text-on-accent hover:brightness-105",
                  )}
                >
                  {isRestoring
                    ? "Restoring..."
                    : restoreMode === "replace"
                      ? "Confirm & Replace All"
                      : "Confirm & Merge"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t-2 border-line flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs hover:brightness-105 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
