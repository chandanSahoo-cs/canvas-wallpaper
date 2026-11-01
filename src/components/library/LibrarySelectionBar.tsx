import React, { useState } from "react";
import { Plus, Tag, Trash2, X } from "lucide-react";
import { LibraryItem } from "../../lib/library/types";
import { useAppStore } from "../../store/useAppStore";
import { useSceneStore } from "../../store/useSceneStore";
import { deleteAsset, saveAsset, getAsset } from "../../lib/assets/db";
import { ImageElement, TextElement } from "../../elements/types";

interface LibrarySelectionBarProps {
  selectedIds: Set<string>;
  allItems: LibraryItem[];
  onClearSelection: () => void;
  onRefreshItems: () => void;
  onCloseLibrary: () => void;
}

export const LibrarySelectionBar: React.FC<LibrarySelectionBarProps> = ({
  selectedIds,
  allItems,
  onClearSelection,
  onRefreshItems,
  onCloseLibrary,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (selectedIds.size === 0) return null;

  const selectedItems = allItems.filter((it) => selectedIds.has(it.id));
  const selectedCount = selectedItems.length;

  // Calculate board usage for selected items
  const affectedBoards = new Map<string, string>(); // sceneId -> sceneName
  let totalPlacements = 0;

  for (const it of selectedItems) {
    for (const p of it.placements) {
      affectedBoards.set(p.sceneId, p.sceneName);
      totalPlacements++;
    }
  }

  // Action: Add to Current Board in tidy grid
  const handleAddToCurrentBoard = () => {
    const state = useAppStore.getState();
    const { zoom, scrollOffset } = state;
    const centerX = window.innerWidth / 2 / zoom + scrollOffset.x;
    const centerY = window.innerHeight / 2 / zoom + scrollOffset.y;

    const cols = Math.max(1, Math.ceil(Math.sqrt(selectedItems.length)));
    const cardW = 300;
    const cardH = 220;
    const gap = 20;

    const startX = centerX - (cols * (cardW + gap) - gap) / 2;
    const startY =
      centerY -
      (Math.ceil(selectedItems.length / cols) * (cardH + gap) - gap) / 2;

    const newElements: (ImageElement | TextElement)[] = [];

    selectedItems.forEach((it, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = Math.round(startX + col * (cardW + gap));
      const y = Math.round(startY + row * (cardH + gap));

      if (it.type === "image" && it.assetId) {
        newElements.push({
          id: `img-${Date.now()}-${idx}`,
          type: "image",
          assetId: it.assetId,
          x,
          y,
          width: cardW,
          height: cardH,
          caption: it.title,
          showCaption: false,
          strokeColor: "#0E1A1F",
          fillColor: "transparent",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          locked: false,
          seed: Math.floor(Math.random() * 2 ** 31),
        });
      } else if (it.type === "text" && it.textContent) {
        newElements.push({
          id: `text-${Date.now()}-${idx}`,
          type: "text",
          text: it.textContent,
          x,
          y,
          strokeColor: "#0E1A1F",
          fillColor: "transparent",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          locked: false,
          seed: Math.floor(Math.random() * 2 ** 31),
        });
      }
    });

    if (newElements.length > 0) {
      state.pushHistory();
      state.setElements([...state.elements, ...newElements]);
      state.setSelectedIds(new Set(newElements.map((el) => el.id)));
      state.setTool("selection");
      if (state.mode === "wallpaper") {
        state.setMode("drawing");
      }
    }

    onClearSelection();
    onCloseLibrary();
  };

  // Action: Bulk Tag
  const handleApplyTag = async () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (!tag) return;

    for (const it of selectedItems) {
      if (it.assetId) {
        const asset = await getAsset(it.assetId);
        if (asset) {
          const currentTags = Array.isArray(asset.tags) ? asset.tags : [];
          if (!currentTags.includes(tag)) {
            asset.tags = [...currentTags, tag];
            await saveAsset(asset);
          }
        }
      }
    }

    setTagInput("");
    setShowTagModal(false);
    onRefreshItems();
  };

  // Action: Delete selected items (and remove from all scenes)
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const assetIdsToDelete = new Set(
        selectedItems.filter((it) => it.assetId).map((it) => it.assetId!),
      );

      // 1. Delete from IndexedDB
      for (const aid of assetIdsToDelete) {
        await deleteAsset(aid);
      }

      // 2. Remove placements from all boards
      const sceneStore = useSceneStore.getState();
      const updatedScenes = sceneStore.scenes.map((scene) => {
        const nextElements = scene.elements.filter((el) => {
          if (el.type === "image") {
            const imgEl = el as ImageElement;
            return !assetIdsToDelete.has(imgEl.assetId);
          }
          return true;
        });

        const nextBackground = { ...scene.background };
        if (
          nextBackground.type === "image" &&
          nextBackground.imageAssetId &&
          assetIdsToDelete.has(nextBackground.imageAssetId)
        ) {
          nextBackground.type = "color";
          delete nextBackground.imageAssetId;
        }

        return {
          ...scene,
          elements: nextElements,
          background: nextBackground,
        };
      });

      useSceneStore.setState({ scenes: updatedScenes });

      // Also update currently loaded canvas elements if active scene was modified
      const currentActive = updatedScenes.find(
        (s) => s.id === sceneStore.activeSceneId,
      );
      if (currentActive) {
        useAppStore.getState().setElements(currentActive.elements);
        useAppStore.getState().setBackground(currentActive.background);
      }

      await sceneStore.saveScenesToStorage();
    } catch (err) {
      console.error("Failed to delete items:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      onClearSelection();
      onRefreshItems();
    }
  };

  return (
    <>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2.5 bg-surface text-ink border-2 border-line rounded-sk shadow-hard select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="font-hand font-bold text-xs pr-2 border-r border-line/20">
          <span>{selectedCount} item{selectedCount > 1 ? "s" : ""} selected</span>
        </div>

        {/* Action: Add to Current Board */}
        <button
          onClick={handleAddToCurrentBoard}
          className="px-3 py-1 text-xs font-hand font-bold rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add to Board</span>
        </button>

        {/* Action: Tag */}
        <button
          onClick={() => setShowTagModal(true)}
          className="px-3 py-1 text-xs font-hand font-bold rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
        >
          <Tag className="w-3.5 h-3.5 text-brand-blue" />
          <span>Tag...</span>
        </button>

        {/* Action: Delete */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-3 py-1 text-xs font-hand font-bold rounded-sk bg-paper text-danger border-2 border-line/30 hover:bg-danger/10 hover:border-danger active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          title="Clear Selection"
          className="p-1 rounded-sk text-muted hover:text-ink cursor-pointer ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div
          onClick={() => setShowTagModal(false)}
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-80 bg-surface text-ink border-2 border-line rounded-sk-lg p-4 shadow-hard flex flex-col gap-3"
          >
            <h4 className="font-hand font-bold text-sm text-ink">
              Add Tag to {selectedCount} Item{selectedCount > 1 ? "s" : ""}
            </h4>
            <input
              type="text"
              autoFocus
              value={tagInput}
              placeholder="e.g. inspiration, mockup, textures..."
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyTag();
                if (e.key === "Escape") setShowTagModal(false);
              }}
              className="w-full px-2.5 py-1.5 text-xs font-sans rounded-sk bg-paper text-ink border-2 border-line/30 focus:border-brand-blue focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowTagModal(false)}
                className="px-3 py-1 text-xs font-hand rounded-sk bg-paper text-ink border border-line/30 hover:bg-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTag}
                className="px-3 py-1 text-xs font-hand font-bold rounded-sk bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm cursor-pointer"
              >
                Apply Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          onClick={() => !isDeleting && setShowDeleteModal(false)}
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-96 bg-surface text-ink border-2 border-line rounded-sk-lg p-5 shadow-hard flex flex-col gap-3 text-left"
          >
            <h4 className="font-hand font-bold text-sm text-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Confirm Delete ({selectedCount} item{selectedCount > 1 ? "s" : ""})</span>
            </h4>

            {totalPlacements > 0 ? (
              <div className="p-3 bg-paper border-2 border-danger rounded-sk text-xs space-y-1.5">
                <p className="font-hand font-bold text-danger">
                  Used on {affectedBoards.size} board{affectedBoards.size > 1 ? "s" : ""} ({totalPlacements} placement{totalPlacements > 1 ? "s" : ""}):
                </p>
                <ul className="list-disc list-inside text-muted text-[11px] font-sans max-h-24 overflow-y-auto">
                  {Array.from(affectedBoards.values()).map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
                <p className="text-[11px] font-sans text-danger font-medium pt-1">
                  Deleting will permanently remove these assets and their placements from all boards. This action cannot be undone.
                </p>
              </div>
            ) : (
              <p className="text-xs font-sans text-muted leading-relaxed">
                These assets are not placed on any boards. Permanently delete them from your local IndexedDB storage? This cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-line/20">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1 text-xs font-hand rounded-sk bg-paper text-ink border border-line/30 hover:bg-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1 text-xs font-hand font-bold rounded-sk bg-danger text-white border-2 border-line shadow-hard hover:brightness-110 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
