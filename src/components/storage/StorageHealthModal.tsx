import React, { useEffect, useState } from "react";
import {
  X,
  HardDrive,
  Copy,
  Trash2,
  Minimize2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Archive,
} from "lucide-react";
import {
  getStorageHealthSummary,
  recompressAsset,
  cleanupOrphans,
  deleteAssetWithPlacements,
  StorageHealthSummary,
  LargestItem,
} from "../../lib/storage/health";
import { useLightboxStore } from "../../lib/lightbox/store";
import { useLibraryStore } from "../../lib/library/store";
import { getAssetObjectUrl } from "../../lib/assets/urls";
import { formatBytes, cn } from "../../lib/utils";

interface StorageHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBackup: () => void;
}

export const StorageHealthModal: React.FC<StorageHealthModalProps> = ({
  isOpen,
  onClose,
  onOpenBackup,
}) => {
  const [summary, setSummary] = useState<StorageHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRecompressId, setConfirmRecompressId] = useState<string | null>(null);
  const [confirmCleanupOrphans, setConfirmCleanupOrphans] = useState(false);

  const refreshSummary = async () => {
    setIsLoading(true);
    try {
      const data = await getStorageHealthSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load storage health summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSummary();
      setActionFeedback(null);
      setConfirmDeleteId(null);
      setConfirmRecompressId(null);
      setConfirmCleanupOrphans(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenDuplicates = () => {
    onClose();
    useLibraryStore.getState().resetFilters();
    useLibraryStore.getState().setFilter("duplicatesOnly", true);
    useLibraryStore.getState().setIsOpen(true);
  };

  const handleInspectInLightbox = (item: LargestItem) => {
    useLightboxStore.getState().open(
      [
        {
          id: item.id,
          assetId: item.id,
          caption: item.note || "Largest Asset View",
          sourceUrl: item.sourceUrl,
          sourceTitle: item.sourceTitle,
          width: item.width,
          height: item.height,
        },
      ],
      0,
    );
  };

  const handleRecompress = async (assetId: string) => {
    try {
      const res = await recompressAsset(assetId);
      if (res.savedBytes > 0) {
        setActionFeedback(
          `Re-compressed! Reclaimed ${formatBytes(res.savedBytes)} (${formatBytes(res.oldBytes)} → ${formatBytes(res.newBytes)})`,
        );
      } else {
        setActionFeedback("Asset is already optimally compressed.");
      }
      setConfirmRecompressId(null);
      await refreshSummary();
    } catch (err: any) {
      setActionFeedback(`Re-compression failed: ${err.message || "Error"}`);
    }
  };

  const handleDeleteItem = async (assetId: string) => {
    try {
      const res = await deleteAssetWithPlacements(assetId);
      setActionFeedback(
        `Deleted asset (removed ${res.placementsRemoved} board placements).`,
      );
      setConfirmDeleteId(null);
      await refreshSummary();
    } catch (err: any) {
      setActionFeedback(`Deletion failed: ${err.message || "Error"}`);
    }
  };

  const handleCleanupOrphans = async () => {
    if (!summary || summary.orphanAssetIds.length === 0) return;
    try {
      const res = await cleanupOrphans(summary.orphanAssetIds);
      setActionFeedback(
        `Cleaned up ${res.deletedCount} orphan assets, reclaimed ${formatBytes(res.reclaimedBytes)}!`,
      );
      setConfirmCleanupOrphans(false);
      await refreshSummary();
    } catch (err: any) {
      setActionFeedback(`Orphan cleanup failed: ${err.message || "Error"}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-health-title"
      className="fixed inset-0 z-50 bg-[#0E1A1F]/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div data-tour="storage-health-modal" className="bg-surface text-ink border-2 border-line rounded-sk-lg p-6 w-full max-w-2xl shadow-hard flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-brand-blue" />
            <h2
              id="storage-health-title"
              className="font-hand text-lg font-bold text-ink"
            >
              Storage Health & Diagnostics
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshSummary}
              disabled={isLoading}
              title="Refresh diagnostics"
              className="p-1 rounded-sk-sm hover:bg-paper text-ink/70 hover:text-ink cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-brand-blue")} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close storage health modal"
              className="p-1 rounded-sk-sm hover:bg-paper text-ink/70 hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="p-2.5 rounded-sk bg-brand-blue/10 border border-brand-blue/40 text-ink text-xs font-hand font-bold flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-muted hover:text-ink text-xs font-mono"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !summary ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-line border-t-brand-blue rounded-full animate-spin" />
            <span className="font-hand text-xs text-muted">Analyzing local storage health...</span>
          </div>
        ) : summary ? (
          <div className="flex flex-col gap-4">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Usage Card */}
              <div className="p-3 bg-paper rounded-sk border-2 border-line/40 flex flex-col justify-between">
                <span className="text-xs font-sans text-muted">Browser Storage</span>
                <div className="my-1 font-mono text-base font-bold text-ink">
                  {formatBytes(summary.usageBytes)}
                </div>
                <div className="text-[11px] font-sans text-muted">
                  Quota: {formatBytes(summary.quotaBytes)} ({summary.percentUsed.toFixed(1)}%)
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mt-2 border border-line/20">
                  <div
                    className="h-full bg-brand-blue transition-all"
                    style={{ width: `${Math.min(100, Math.max(2, summary.percentUsed))}%` }}
                  />
                </div>
              </div>

              {/* Originals vs Thumbs Card */}
              <div className="p-3 bg-paper rounded-sk border-2 border-line/40 flex flex-col justify-between">
                <span className="text-xs font-sans text-muted">Images Breakdown</span>
                <div className="my-1 font-mono text-base font-bold text-ink">
                  {formatBytes(summary.originalBytes)}
                </div>
                <div className="text-[11px] font-mono text-muted flex items-center justify-between">
                  <span>Thumbs: {formatBytes(summary.thumbnailBytes)}</span>
                </div>
                <div className="text-[10px] font-sans text-brand-green font-medium mt-1">
                  IndexedDB 100% on-device
                </div>
              </div>

              {/* Boards & Assets Card */}
              <div className="p-3 bg-paper rounded-sk border-2 border-line/40 flex flex-col justify-between">
                <span className="text-xs font-sans text-muted">Workspace Scale</span>
                <div className="my-1 font-mono text-base font-bold text-ink">
                  {summary.totalAssets} Assets
                </div>
                <div className="text-[11px] font-sans text-muted">
                  Across {summary.totalBoards} Boards
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={handleOpenDuplicates}
                    className="text-[11px] font-hand font-bold text-brand-blue hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Check Duplicates</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Orphan Assets Banner */}
            {summary.orphanAssetIds.length > 0 ? (
              <div className="p-3 rounded-sk bg-surface border-2 border-brand-blue flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-hand font-bold text-xs text-ink flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-blue" />
                    <span>
                      {summary.orphanAssetIds.length} Unreferenced Assets Found
                    </span>
                  </div>
                  <div className="text-[11px] font-sans text-muted">
                    {formatBytes(summary.orphanBytes)} can be reclaimed by cleaning up assets no longer placed on any board.
                  </div>
                </div>

                {confirmCleanupOrphans ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setConfirmCleanupOrphans(false)}
                      className="px-2 py-1 rounded-sk bg-paper text-ink font-hand text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCleanupOrphans}
                      className="px-3 py-1 rounded-sk bg-danger text-white font-hand font-bold text-xs border border-line shadow-hard-sm cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCleanupOrphans(true)}
                    className="px-3 py-1.5 rounded-sk bg-paper hover:bg-surface text-ink border-2 border-line font-hand font-bold text-xs shadow-hard-sm cursor-pointer"
                  >
                    Clean Up Orphans
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-sk bg-brand-green/10 border border-brand-green/30 text-ink text-xs font-hand font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                <span>Zero orphan assets: all images are referenced on active boards or inbox.</span>
              </div>
            )}

            {/* Integrity Check Summary */}
            {summary.missingReferences.length > 0 ? (
              <div className="p-3 rounded-sk bg-danger/10 border-2 border-danger text-danger flex flex-col gap-1.5">
                <div className="font-hand font-bold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Integrity Issue: {summary.missingReferences.length} missing asset references</span>
                </div>
                <div className="max-h-24 overflow-y-auto text-[11px] font-mono flex flex-col gap-0.5">
                  {summary.missingReferences.map((ref, idx) => (
                    <div key={idx}>
                      Board "{ref.boardName}": missing {ref.isBackground ? "background" : "element"} asset ID {ref.assetId.slice(0, 12)}...
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-sk bg-paper border border-line/30 text-ink text-xs font-hand font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                <span>Integrity Verified: all board and wallpaper assets exist in IndexedDB.</span>
              </div>
            )}

            {/* Top 10 Largest Items Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-hand font-bold text-sm text-ink">
                    Largest Items (Top 10)
                  </div>
                  <div className="text-xs font-sans text-muted">
                    Inspect, delete, or lossy re-compress large images to WebP (max 4096px @ 0.9 quality).
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
                {summary.largestItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-paper rounded-sk border border-line/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-sk bg-surface border border-line/30 overflow-hidden shrink-0 flex items-center justify-center">
                        <LargestItemThumb assetId={item.id} />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="font-hand font-bold text-ink truncate">
                          {item.note || item.sourceTitle || item.hash.slice(0, 10)}
                        </span>
                        <div className="text-[10px] font-mono text-muted flex items-center gap-1.5 flex-wrap">
                          <span>{formatBytes(item.bytes)}</span>
                          <span>•</span>
                          <span>{item.width}×{item.height}</span>
                          <span>•</span>
                          <span className="uppercase">{item.mime.split("/")[1]}</span>
                          <span>•</span>
                          <span className={item.boardUsageCount > 0 ? "text-brand-blue" : "text-muted"}>
                            {item.boardUsageCount > 0
                              ? `Used on ${item.boardUsageCount} board(s)`
                              : "Not placed"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Lightbox */}
                      <button
                        onClick={() => handleInspectInLightbox(item)}
                        title="View in Lightbox"
                        className="p-1.5 rounded-sk bg-surface hover:bg-paper text-ink border border-line/30 shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Re-compress */}
                      {confirmRecompressId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmRecompressId(null)}
                            className="px-1.5 py-0.5 rounded-sk bg-surface text-ink text-[10px] font-hand cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRecompress(item.id)}
                            className="px-2 py-0.5 rounded-sk bg-brand-blue text-on-accent text-[10px] font-hand font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRecompressId(item.id)}
                          title="Re-compress to WebP (max 4096px, 0.9 quality)"
                          className="p-1.5 rounded-sk bg-surface hover:bg-paper text-brand-blue border border-line/30 shadow-xs cursor-pointer"
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 rounded-sk bg-surface text-ink text-[10px] font-hand cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-2 py-0.5 rounded-sk bg-danger text-white text-[10px] font-hand font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          title={
                            item.boardUsageCount > 0
                              ? `Used on ${item.boardUsageCount} boards! Click to confirm delete`
                              : "Delete asset"
                          }
                          className="p-1.5 rounded-sk bg-surface hover:bg-danger/10 text-muted hover:text-danger border border-line/30 shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backup Nudge & Status Card */}
            <div className="p-3 bg-paper rounded-sk border-2 border-line/40 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-hand font-bold text-xs text-ink flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-brand-blue" />
                  <span>
                    {summary.daysSinceBackup !== null
                      ? `Last Backup: ${summary.daysSinceBackup} days ago`
                      : "No Backup Exported Yet"}
                  </span>
                </div>
                <div className="text-[11px] font-sans text-muted">
                  Keep your drawings and images safely exported in a local .zip archive.
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenBackup();
                }}
                className="px-3.5 py-1.5 rounded-sk bg-brand-green text-on-accent border-2 border-line font-hand font-bold text-xs shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                Export Backup Now
              </button>
            </div>
          </div>
        ) : null}

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

// Thumbnail subcomponent
const LargestItemThumb: React.FC<{ assetId: string }> = ({ assetId }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAssetObjectUrl(assetId).then((res) => {
      if (!cancelled) setUrl(res);
    });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (!url) return <div className="w-full h-full bg-paper" />;
  return (
    <img
      src={url}
      alt=""
      className="w-full h-full object-cover"
      draggable={false}
    />
  );
};
