import React, { useState, useEffect } from "react";
import { AlertTriangle, Check, GitMerge, Loader2, X } from "lucide-react";
import { DuplicateGroup } from "../../lib/library/duplicates";
import { LibraryItem } from "../../lib/library/types";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const ItemThumb: React.FC<{ item: LibraryItem; className?: string }> = ({
  item,
  className = "w-full h-full object-contain",
}) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!item.thumbBlob) return;
    const objUrl = URL.createObjectURL(item.thumbBlob);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [item.thumbBlob]);

  if (!url) {
    return <span className="text-xs text-muted font-sans">No preview</span>;
  }
  return <img src={url} alt="" className={className} />;
};

interface MergeDuplicatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: DuplicateGroup | null;
  keeperId: string;
  onConfirmMerge: () => Promise<void>;
  isMerging: boolean;
}

export const MergeDuplicatesDialog: React.FC<MergeDuplicatesDialogProps> = ({
  isOpen,
  onClose,
  group,
  keeperId,
  onConfirmMerge,
  isMerging,
}) => {
  if (!isOpen || !group) return null;

  const keeperItem = group.items.find((it) => it.id === keeperId) || group.items[0];
  const duplicateItems = group.items.filter((it) => it.id !== keeperItem.id);

  // Calculate affected placements
  const affectedPlacements = duplicateItems.flatMap((it) => it.placements || []);
  const affectedBoards = new Map<string, string>();
  for (const p of affectedPlacements) {
    affectedBoards.set(p.sceneId, p.sceneName);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-70 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-100 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface text-ink border-2 border-line rounded-sk-lg p-5 shadow-hard flex flex-col gap-4 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-line">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-brand-blue" />
            <h3 className="font-hand font-bold text-base text-ink">
              Merge Duplicate Assets
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sk text-muted hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Keeper Box */}
            <div className="p-3 bg-brand-green/10 border-2 border-brand-green rounded-sk flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-hand font-bold text-brand-green uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Keeper Image</span>
                </span>
                <span className="text-[10px] font-mono text-muted">
                  {formatBytes(keeperItem.bytes || 0)}
                </span>
              </div>

              <div className="w-full h-32 rounded-sk-sm bg-paper border border-line/40 overflow-hidden flex items-center justify-center">
                <ItemThumb item={keeperItem} />
              </div>

              <div className="text-xs font-hand font-bold text-ink truncate">
                {keeperItem.title}
              </div>
              <div className="text-[11px] font-sans text-muted">
                Used on {keeperItem.placements?.length || 0} board(s)
              </div>
            </div>

            {/* Duplicates to be replaced */}
            <div className="p-3 bg-danger/5 border-2 border-danger/40 rounded-sk flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-hand font-bold text-danger uppercase tracking-wider">
                  Duplicates ({duplicateItems.length})
                </span>
                <span className="text-[10px] font-sans text-muted">
                  Will be deleted
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {duplicateItems.map((dup) => (
                  <div
                    key={dup.id}
                    className="h-16 rounded-sk-sm bg-paper border border-line/30 overflow-hidden relative flex items-center justify-center"
                  >
                    <ItemThumb item={dup} className="w-full h-full object-cover opacity-60" />
                    <span className="absolute bottom-0 inset-x-0 bg-ink/70 text-[9px] font-mono text-white text-center px-1 truncate">
                      {dup.placements?.length || 0} board(s)
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-xs font-hand font-bold text-ink">
                {duplicateItems.length} duplicate file(s)
              </div>
              <div className="text-[11px] font-sans text-muted">
                {affectedPlacements.length} placement(s) across {affectedBoards.size} board(s)
              </div>
            </div>
          </div>

          {/* Merge Details Summary */}
          <div className="p-3 bg-paper rounded-sk border border-line/30 text-xs font-sans space-y-1.5">
            <div className="font-hand font-bold text-ink text-sm">
              Summary of Changes:
            </div>
            <ul className="list-disc list-inside space-y-1 text-muted text-[11px]">
              <li>
                <strong className="text-ink">{affectedPlacements.length}</strong> placement(s) on{" "}
                <strong className="text-ink">
                  {Array.from(affectedBoards.values()).join(", ") || "no boards"}
                </strong>{" "}
                will be automatically repointed to the keeper image.
              </li>
              <li>
                <span className="text-brand-green font-semibold">
                  Captions preserved:
                </span>{" "}
                each image element's custom caption and position will remain unchanged.
              </li>
              <li>
                <strong className="text-danger">{duplicateItems.length}</strong> duplicate asset(s) will be permanently deleted from local IndexedDB storage.
              </li>
            </ul>
          </div>

          {/* Caution Alert */}
          <div className="flex items-center gap-2 p-2.5 bg-warning/10 border border-warning/40 rounded-sk text-xs text-ink">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span className="text-[11px] font-sans">
              This operation updates boards and permanently removes duplicate storage files. It cannot be undone.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-line">
          <button
            type="button"
            onClick={onClose}
            disabled={isMerging}
            className="px-3 py-1.5 text-xs font-hand font-bold rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirmMerge}
            disabled={isMerging}
            className="px-4 py-1.5 text-xs font-hand font-bold rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Merging...</span>
              </>
            ) : (
              <>
                <GitMerge className="w-3.5 h-3.5" />
                <span>Merge & Repoint Placements</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
