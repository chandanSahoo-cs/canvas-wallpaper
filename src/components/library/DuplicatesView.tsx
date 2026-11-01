import React, { useState, useEffect, useMemo } from "react";
import { Check, Copy, GitMerge, MapPin, Sparkles, AlertCircle } from "lucide-react";
import { LibraryItem } from "../../lib/library/types";
import { DuplicateGroup, findDuplicateGroups, mergeDuplicateAssets } from "../../lib/library/duplicates";
import { MergeDuplicatesDialog } from "./MergeDuplicatesDialog";
import { useSceneStore } from "../../store/useSceneStore";
import { cn } from "../../lib/utils";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const ItemThumb: React.FC<{ item: LibraryItem }> = ({ item }) => {
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
  return <img src={url} alt="" className="w-full h-full object-contain" />;
};

interface DuplicatesViewProps {
  items: LibraryItem[];
  onRefreshItems: () => void;
  onLocate: (sceneId: string, elementId?: string) => void;
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({
  items,
  onRefreshItems,
  onLocate,
}) => {
  const scenes = useSceneStore((s) => s.scenes);

  // Group all items into near-duplicate clusters (Hamming distance <= 5)
  const groups: DuplicateGroup[] = useMemo(() => {
    return findDuplicateGroups(items, 5);
  }, [items]);

  // Track chosen keeper per group
  const [chosenKeepers, setChosenKeepers] = useState<Record<string, string>>({});
  const [mergingGroup, setMergingGroup] = useState<DuplicateGroup | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const getKeeperId = (group: DuplicateGroup): string => {
    return chosenKeepers[group.groupId] || group.items[0].id;
  };

  const handleSelectKeeper = (groupId: string, itemId: string) => {
    setChosenKeepers((prev) => ({ ...prev, [groupId]: itemId }));
  };

  const handleExecuteMerge = async () => {
    if (!mergingGroup) return;
    setIsMerging(true);
    try {
      const keeperId = getKeeperId(mergingGroup);
      const duplicateIds = mergingGroup.items
        .filter((it) => it.id !== keeperId)
        .map((it) => it.id);

      await mergeDuplicateAssets(keeperId, duplicateIds, scenes);
      setMergingGroup(null);
      onRefreshItems();
    } catch (err) {
      console.error("Failed to merge duplicate group:", err);
    } finally {
      setIsMerging(false);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-12 h-12 rounded-sk bg-brand-green/10 text-brand-green border-2 border-brand-green flex items-center justify-center mb-3">
          <Check className="w-6 h-6 stroke-[3]" />
        </div>
        <h3 className="font-hand font-bold text-base text-ink mb-1">
          No Duplicates Found
        </h3>
        <p className="text-xs font-sans text-muted max-w-sm">
          All images in your library have unique perceptual visual hashes (dHash Hamming distance &gt; 5).
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-line/20">
        <div>
          <h3 className="font-hand font-bold text-base text-ink flex items-center gap-2">
            <span>Near-Duplicate Clusters</span>
            <span className="text-xs font-mono font-normal text-muted bg-paper px-1.5 py-0.5 rounded-sk border border-line/20">
              {groups.length} group{groups.length > 1 ? "s" : ""}
            </span>
          </h3>
          <p className="text-xs font-sans text-muted">
            Images with similar visual composition (Hamming distance &le; 5 bits). Choose a keeper to merge and cleanup.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group, groupIdx) => {
          const currentKeeperId = getKeeperId(group);

          return (
            <div
              key={group.groupId}
              className="bg-paper border-2 border-line rounded-sk p-3.5 shadow-hard flex flex-col gap-3"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-line/20">
                <div className="flex items-center gap-2">
                  <span className="font-hand font-bold text-sm text-ink">
                    Group #{groupIdx + 1}
                  </span>
                  <span className="text-[11px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded-sk border border-line/20">
                    {group.items.length} copies
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    (diff: {group.minDistance} / 64 bits)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMergingGroup(group)}
                  className="px-3 py-1 text-xs font-hand font-bold rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Merge Group...</span>
                </button>
              </div>

              {/* Side-by-side items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.items.map((item) => {
                  const isKeeper = item.id === currentKeeperId;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectKeeper(group.groupId, item.id)}
                      className={cn(
                        "relative flex flex-col bg-surface rounded-sk border-2 p-2.5 transition-all cursor-pointer shadow-hard-sm",
                        isKeeper
                          ? "border-brand-green ring-2 ring-brand-green/30"
                          : "border-line/40 hover:border-line",
                      )}
                    >
                      {/* Keeper Badge / Select Radio */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-hand font-bold px-1.5 py-0.5 rounded-sk flex items-center gap-1",
                            isKeeper
                              ? "bg-brand-green text-on-accent"
                              : "bg-paper text-muted border border-line/30",
                          )}
                        >
                          {isKeeper ? (
                            <>
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Keeper</span>
                            </>
                          ) : (
                            <span>Set as Keeper</span>
                          )}
                        </span>

                        <span className="text-[10px] font-mono text-muted">
                          {formatBytes(item.bytes || 0)}
                        </span>
                      </div>

                      {/* Thumbnail */}
                      <div className="w-full aspect-video rounded-sk-sm bg-paper border border-line/30 overflow-hidden mb-2 flex items-center justify-center">
                        <ItemThumb item={item} />
                      </div>

                      {/* Info */}
                      <div className="text-xs font-hand font-bold text-ink truncate mb-0.5">
                        {item.title}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-sans text-muted mb-2">
                        <MapPin className="w-3 h-3 shrink-0 text-brand-blue" />
                        <span>Used on {item.placements?.length || 0} board(s)</span>
                      </div>

                      {/* Placements list if any */}
                      {item.placements && item.placements.length > 0 && (
                        <div className="flex flex-col gap-1 pt-1.5 border-t border-line/20 mt-auto">
                          {item.placements.map((p) => (
                            <button
                              key={p.sceneId + (p.elementId || "")}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLocate(p.sceneId, p.elementId);
                              }}
                              className="text-left text-[10px] font-hand text-brand-blue hover:underline truncate"
                            >
                              Jump to: {p.sceneName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Merge Confirmation Dialog */}
      <MergeDuplicatesDialog
        isOpen={Boolean(mergingGroup)}
        onClose={() => setMergingGroup(null)}
        group={mergingGroup}
        keeperId={mergingGroup ? getKeeperId(mergingGroup) : ""}
        onConfirmMerge={handleExecuteMerge}
        isMerging={isMerging}
      />
    </div>
  );
};
