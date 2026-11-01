import React, { useState, useEffect } from "react";
import { Check, Edit2, GitMerge, Plus, Tag, Trash2, X } from "lucide-react";
import {
  createOrUpdateTag,
  deleteTag,
  getAllTagInfos,
  mergeTags,
  renameTag,
  TAG_LABEL_COLORS,
  TagInfo,
} from "../../lib/search/tags";

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated: () => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  onTagsUpdated,
}) => {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>(TAG_LABEL_COLORS[0]);

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const [mergingTag, setMergingTag] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string>("");

  const loadTags = async () => {
    const list = await getAllTagInfos();
    setTags(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    await createOrUpdateTag(newTagName, newTagColor);
    setNewTagName("");
    await loadTags();
    onTagsUpdated();
  };

  const handleRename = async (oldName: string) => {
    if (!renameInput.trim() || renameInput === oldName) {
      setEditingTag(null);
      return;
    }
    await renameTag(oldName, renameInput);
    setEditingTag(null);
    setRenameInput("");
    await loadTags();
    onTagsUpdated();
  };

  const handleDelete = async (name: string) => {
    if (confirm(`Delete tag #${name}? This removes the tag from all assets.`)) {
      await deleteTag(name);
      await loadTags();
      onTagsUpdated();
    }
  };

  const handleMerge = async () => {
    if (!mergingTag || !mergeTarget || mergingTag === mergeTarget) return;
    if (
      confirm(
        `Merge #${mergingTag} into #${mergeTarget}? All assets tagged with #${mergingTag} will be retagged as #${mergeTarget}.`,
      )
    ) {
      await mergeTags(mergingTag, mergeTarget);
      setMergingTag(null);
      setMergeTarget("");
      await loadTags();
      onTagsUpdated();
    }
  };

  const handleColorChange = async (tagName: string, color: string) => {
    await createOrUpdateTag(tagName, color);
    await loadTags();
    onTagsUpdated();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-100 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface text-ink border-2 border-line rounded-sk-lg p-5 shadow-hard flex flex-col gap-4 max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b-2 border-line">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-blue" />
            <h3 className="font-hand font-bold text-base text-ink">
              Manage Tags
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sk text-muted hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create New Tag */}
        <div className="flex items-center gap-2 p-2 bg-paper rounded-sk border border-line/30">
          <input
            type="text"
            value={newTagName}
            placeholder="New tag name..."
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 px-2 py-1 text-xs font-sans rounded-sk-sm bg-surface text-ink border border-line/30 focus:border-brand-blue focus:outline-none"
          />

          {/* Color choices */}
          <div className="flex items-center gap-1">
            {TAG_LABEL_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setNewTagColor(col)}
                className="w-4 h-4 rounded-full border border-line/50 transition-transform cursor-pointer"
                style={{
                  backgroundColor: col,
                  transform: newTagColor === col ? "scale(1.2)" : "scale(1)",
                  outline: newTagColor === col ? "2px solid var(--ink)" : "none",
                }}
              />
            ))}
          </div>

          <button
            onClick={handleCreate}
            className="px-2.5 py-1 text-xs font-hand font-bold rounded-sk-sm bg-brand-green text-on-accent border border-line shadow-sm hover:brightness-105 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add</span>
          </button>
        </div>

        {/* Merge section if active */}
        {mergingTag && (
          <div className="p-2.5 bg-brand-blue/10 border-2 border-brand-blue rounded-sk flex flex-col gap-2 text-xs">
            <div className="font-hand font-bold text-blue-text flex items-center justify-between">
              <span>Merge #{mergingTag} into:</span>
              <button
                onClick={() => setMergingTag(null)}
                className="text-muted hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="flex-1 px-2 py-1 text-xs font-hand rounded-sk bg-surface border border-line focus:outline-none"
              >
                <option value="">Select target tag...</option>
                {tags
                  .filter((t) => t.name !== mergingTag)
                  .map((t) => (
                    <option key={t.name} value={t.name}>
                      #{t.name}
                    </option>
                  ))}
              </select>
              <button
                disabled={!mergeTarget}
                onClick={handleMerge}
                className="px-3 py-1 font-hand font-bold rounded-sk bg-brand-blue text-on-accent border border-line disabled:opacity-40 cursor-pointer"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        )}

        {/* Tag List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72">
          {tags.length === 0 ? (
            <div className="text-center py-6 text-muted font-hand text-xs">
              No tags created yet.
            </div>
          ) : (
            tags.map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between p-2 rounded-sk bg-paper border border-line/20 hover:border-line/50 transition-colors text-xs"
              >
                {editingTag === t.name ? (
                  <div className="flex items-center gap-1.5 flex-1 mr-2">
                    <input
                      type="text"
                      autoFocus
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(t.name);
                        if (e.key === "Escape") setEditingTag(null);
                      }}
                      className="px-2 py-0.5 text-xs font-sans rounded-sk bg-surface border border-line flex-1"
                    />
                    <button
                      onClick={() => handleRename(t.name)}
                      className="p-1 text-brand-green hover:brightness-110 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingTag(null)}
                      className="p-1 text-muted hover:text-ink cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Swatch picker dropdown/pill */}
                    <div className="flex items-center gap-1">
                      {TAG_LABEL_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleColorChange(t.name, col)}
                          title={`Color ${col}`}
                          className="w-3 h-3 rounded-full border border-line/40 transition-transform cursor-pointer"
                          style={{
                            backgroundColor: col,
                            transform: t.color === col ? "scale(1.25)" : "scale(1)",
                            outline: t.color === col ? "1.5px solid var(--ink)" : "none",
                          }}
                        />
                      ))}
                    </div>
                    <span className="font-hand font-bold text-ink">#{t.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingTag(t.name);
                      setRenameInput(t.name);
                    }}
                    title="Rename tag"
                    className="p-1 rounded-sk text-muted hover:text-ink hover:bg-surface cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setMergingTag(t.name)}
                    title="Merge into another tag"
                    className="p-1 rounded-sk text-muted hover:text-brand-blue hover:bg-surface cursor-pointer"
                  >
                    <GitMerge className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.name)}
                    title="Delete tag"
                    className="p-1 rounded-sk text-muted hover:text-danger hover:bg-surface cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
