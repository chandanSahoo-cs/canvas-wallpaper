import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FolderOpen, X } from "lucide-react";
import { useLibraryStore } from "../../lib/library/store";
import {
  filterLibraryItems,
  loadAllLibraryItems,
  sortLibraryItems,
} from "../../lib/library/crossReference";
import { LibraryItem } from "../../lib/library/types";
import { useSceneStore } from "../../store/useSceneStore";
import { useAppStore } from "../../store/useAppStore";
import { getBBox, getCenter } from "../../canvas/geometry";
import { LibraryToolbar } from "./LibraryToolbar";
import { VirtualizedGrid } from "./VirtualizedGrid";
import { LibrarySelectionBar } from "./LibrarySelectionBar";
import { TagManagerModal } from "./TagManagerModal";
import { DuplicatesView } from "./DuplicatesView";

export const LibraryModal: React.FC = () => {
  const isOpen = useLibraryStore((s) => s.isOpen);
  const setIsOpen = useLibraryStore((s) => s.setIsOpen);
  const selectedIds = useLibraryStore((s) => s.selectedIds);
  const toggleSelect = useLibraryStore((s) => s.toggleSelect);
  const selectRange = useLibraryStore((s) => s.selectRange);
  const clearSelection = useLibraryStore((s) => s.clearSelection);
  const filters = useLibraryStore((s) => s.filters);
  const setFilter = useLibraryStore((s) => s.setFilter);
  const clearFilter = useLibraryStore((s) => s.clearFilter);
  const resetFilters = useLibraryStore((s) => s.resetFilters);
  const sortBy = useLibraryStore((s) => s.sortBy);
  const setSortBy = useLibraryStore((s) => s.setSortBy);

  const scenes = useSceneStore((s) => s.scenes);

  const [rawItems, setRawItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const refreshItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadAllLibraryItems(scenes);
      setRawItems(loaded);
    } catch (err) {
      console.error("Failed to load library items:", err);
    } finally {
      setIsLoading(false);
    }
  }, [scenes]);

  useEffect(() => {
    if (isOpen) {
      refreshItems();
    } else {
      clearSelection();
    }
  }, [isOpen, refreshItems, clearSelection]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, setIsOpen]);

  // Available tags across all library items
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const it of rawItems) {
      for (const t of it.tags) {
        if (t.trim()) tagSet.add(t.trim());
      }
    }
    return Array.from(tagSet).sort();
  }, [rawItems]);

  // Filtered and sorted items
  const displayItems = useMemo(() => {
    const filtered = filterLibraryItems(rawItems, filters);
    return sortLibraryItems(filtered, sortBy);
  }, [rawItems, filters, sortBy]);

  // Locate an element on a specific board
  const handleLocate = (sceneId: string, elementId?: string) => {
    const targetScene = scenes.find((s) => s.id === sceneId);
    if (!targetScene) return;

    // 1. Switch active scene
    useSceneStore.getState().switchScene(sceneId);

    // 2. Close Library view
    setIsOpen(false);

    // 3. Switch mode to drawing if needed
    if (useAppStore.getState().mode === "wallpaper") {
      useAppStore.getState().setMode("drawing");
    }

    // 4. If specific elementId provided, select it and center/zoom to fit it
    if (elementId) {
      const el = targetScene.elements.find((e) => e.id === elementId);
      if (el) {
        useAppStore.getState().setSelectedIds(new Set([elementId]));

        const center = getCenter(el);
        const bbox = getBBox(el);

        // Calculate suitable zoom level so element fits with comfortable padding
        const pad = 120;
        const targetZoomX = (window.innerWidth - pad * 2) / Math.max(bbox.w, 100);
        const targetZoomY = (window.innerHeight - pad * 2) / Math.max(bbox.h, 100);
        const zoom = Math.max(0.5, Math.min(2.0, Math.min(targetZoomX, targetZoomY)));

        useAppStore.getState().setZoom(zoom);
        useAppStore.getState().setScrollOffset({
          x: center.x - window.innerWidth / (2 * zoom),
          y: center.y - window.innerHeight / (2 * zoom),
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-3 select-none animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PaperTab Library"
        onClick={(e) => e.stopPropagation()}
        className="w-[96vw] max-w-6xl h-[90vh] bg-surface text-ink border-2 border-line rounded-sk-lg shadow-hard flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-line shrink-0 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sk bg-paper border-2 border-line flex items-center justify-center text-ink shrink-0">
              <FolderOpen className="w-4 h-4 text-brand-blue" />
            </div>
            <div>
              <h2 className="font-hand text-lg font-bold leading-tight text-ink flex items-center gap-2">
                <span>Library</span>
                <span className="text-xs font-mono font-normal text-muted bg-paper px-1.5 py-0.5 rounded-sk border border-line/20">
                  {rawItems.length}
                </span>
              </h2>
              <p className="text-[11px] font-sans text-muted">
                All saved images, assets, and notes across all boards
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close library"
            className="p-1.5 rounded-sk text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <LibraryToolbar
          filters={filters}
          sortBy={sortBy}
          scenes={scenes}
          availableTags={availableTags}
          totalItemCount={rawItems.length}
          filteredItemCount={displayItems.length}
          onFilterChange={setFilter}
          onClearFilter={clearFilter}
          onResetFilters={resetFilters}
          onSortChange={setSortBy}
          onOpenTagManager={() => setIsTagManagerOpen(true)}
        />

        {/* Virtualized Grid or Duplicates Side-by-Side View */}
        {filters.duplicatesOnly ? (
          <DuplicatesView
            items={displayItems}
            onRefreshItems={refreshItems}
            onLocate={handleLocate}
          />
        ) : (
          <VirtualizedGrid
            items={displayItems}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectRange={(targetId) =>
              selectRange(
                displayItems.map((it) => it.id),
                targetId,
              )
            }
            onLocate={handleLocate}
            onTagClick={(tag) => setFilter("tag", tag)}
          />
        )}

        {/* Multi-Select Action Bar */}
        <LibrarySelectionBar
          selectedIds={selectedIds}
          allItems={displayItems}
          onClearSelection={clearSelection}
          onRefreshItems={refreshItems}
          onCloseLibrary={() => setIsOpen(false)}
        />

        {/* Tag Manager Modal */}
        <TagManagerModal
          isOpen={isTagManagerOpen}
          onClose={() => setIsTagManagerOpen(false)}
          onTagsUpdated={refreshItems}
        />
      </div>
    </div>
  );
};
