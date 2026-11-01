import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Trash2, Check, Edit2, LayoutTemplate } from "lucide-react";
import { useSceneStore, MAX_SCENES } from "../store/useSceneStore";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";

export const SceneSwitcher: React.FC = () => {
  const scenes = useSceneStore((s) => s.scenes);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const switchScene = useSceneStore((s) => s.switchScene);
  const createScene = useSceneStore((s) => s.createScene);
  const deleteScene = useSceneStore((s) => s.deleteScene);
  const renameScene = useSceneStore((s) => s.renameScene);

  const isAtLimit = scenes.length >= MAX_SCENES;

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setEditingId(null);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (
    e: React.MouseEvent,
    id: string,
    currentName: string,
  ) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveRename = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed) {
      renameScene(id, trimmed);
    }
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (scenes.length <= 1) return;
    deleteScene(id);
  };

  const handleCreate = () => {
    if (isAtLimit) return;
    setEditingId(null);
    createScene();
  };

  return (
    <div ref={popoverRef} className="fixed top-4 left-4 z-30 select-none">
      {/* Trigger Button */}
      <div
        id="tour-scene-switcher"
        className="flex items-center gap-1 bg-surface border-2 border-line shadow-hard rounded-sk p-1"
      >
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-sk-sm hover:bg-paper text-ink transition-colors cursor-pointer"
          title="Switch Wallpaper Scene"
        >
          {/* Active scene background color indicator */}
          <span
            className="w-3.5 h-3.5 rounded-full border border-line/30 shadow-inner shrink-0"
            style={{
              backgroundColor: activeScene?.background?.color || "var(--paper)",
            }}
          />
          <span className="font-hand font-bold text-xs max-w-[130px] truncate text-ink">
            {activeScene?.name || "Wallpaper"}
          </span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-ink/60 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {/* Quick Presets Icon Button */}
        <button
          onClick={() => useAppStore.getState().setIsPresetsOpen(true)}
          title="Wallpaper Presets & Templates"
          className="w-8 h-8 rounded-sk-sm flex items-center justify-center hover:bg-paper text-ink/70 hover:text-ink transition-colors cursor-pointer"
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-surface text-ink border-2 border-line shadow-hard rounded-sk-lg p-2.5 z-40 animate-in fade-in duration-100">
          <div className="flex items-center justify-between px-2 py-1 mb-1.5 text-[11px] font-hand font-bold text-muted uppercase tracking-wider">
            <span>Wallpapers</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-sk-sm font-mono text-[10px] border border-line/30",
                isAtLimit
                  ? "bg-warning text-white"
                  : "bg-paper text-ink",
              )}
            >
              {scenes.length}/{MAX_SCENES}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
            {scenes.map((s) => {
              const isActive = s.id === activeSceneId;
              const isRenaming = editingId === s.id;

              if (isRenaming) {
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-sk bg-paper border-2 border-line"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(s.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 bg-surface text-xs font-sans text-ink px-2 py-1 rounded-sk-sm border border-line outline-none focus-visible:outline-brand-blue"
                    />
                    <button
                      onClick={() => handleSaveRename(s.id)}
                      className="p-1 rounded-sk-sm bg-brand-green text-on-accent border border-line hover:brightness-105 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    switchScene(s.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "group flex items-center justify-between px-2.5 py-2 rounded-sk transition-all cursor-pointer text-xs font-hand",
                    isActive
                      ? "bg-paper text-ink font-bold border-2 border-line shadow-hard-sm"
                      : "hover:bg-paper text-ink/80 border-2 border-transparent",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full border border-line/30 shadow-inner shrink-0"
                      style={{
                        backgroundColor: s.background?.color || "var(--paper)",
                      }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Rename icon */}
                    <button
                      onClick={(e) => handleStartRename(e, s.id, s.name)}
                      title="Rename"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-sk-sm hover:bg-paper text-ink/60 hover:text-ink transition-opacity cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {/* Delete icon */}
                    {scenes.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(e, s.id)}
                        title="Delete Scene"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-sk-sm hover:bg-danger/10 text-muted hover:text-danger transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-brand-green ml-0.5 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-1.5 border-t border-line/20">
            {isAtLimit ? (
              <div className="w-full py-1.5 px-2 rounded-sk bg-paper text-muted text-center font-hand text-[11px] select-none border border-line/20">
                Maximum {MAX_SCENES} wallpapers reached
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sk bg-brand-green text-on-accent font-hand font-bold text-xs border-2 border-line shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Blank
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    useAppStore.getState().setIsPresetsOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sk bg-surface text-ink border-2 border-line font-hand font-bold text-xs shadow-hard-sm hover:bg-paper active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-brand-blue" /> Presets
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
