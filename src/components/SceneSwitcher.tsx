import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Check, Edit2, Sparkles } from 'lucide-react';
import { useSceneStore } from '../store/useSceneStore';
import { cn } from '../lib/utils';

export const SceneSwitcher: React.FC = () => {
  const scenes = useSceneStore((s) => s.scenes);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const switchScene = useSceneStore((s) => s.switchScene);
  const createScene = useSceneStore((s) => s.createScene);
  const deleteScene = useSceneStore((s) => s.deleteScene);
  const renameScene = useSceneStore((s) => s.renameScene);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (e: React.MouseEvent, id: string, currentName: string) => {
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
    const newId = createScene();
    setEditingId(newId);
    setEditName(`Wallpaper ${scenes.length + 1}`);
  };

  return (
    <div ref={popoverRef} className="fixed top-4 left-4 z-30 select-none">
      {/* Trigger Button */}
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-md hover:shadow-lg rounded-2xl p-1 transition-all duration-200">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100/80 text-neutral-800 transition-colors"
          title="Switch Wallpaper Scene"
        >
          {/* Active scene background color indicator */}
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-inner shrink-0"
            style={{ backgroundColor: activeScene?.background?.color || '#14141a' }}
          />
          <span className="text-xs font-semibold max-w-[130px] truncate">
            {activeScene?.name || 'Wallpaper'}
          </span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-neutral-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-neutral-600'
            )}
          />
        </button>

        {/* Quick New Scene Button */}
        <button
          onClick={handleCreate}
          title="Add New Wallpaper Scene"
          className="w-7 h-7 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Glassmorphic Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-64 bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
            <span>Wallpapers</span>
            <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-full font-mono text-[9px]">
              {scenes.length}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {scenes.map((s) => {
              const isActive = s.id === activeSceneId;
              const isRenaming = editingId === s.id;

              if (isRenaming) {
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-200"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(s.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-white text-xs font-medium text-neutral-800 px-2 py-1 rounded-lg border border-indigo-300 outline-none"
                    />
                    <button
                      onClick={() => handleSaveRename(s.id)}
                      className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
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
                    'group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all cursor-pointer text-xs',
                    isActive
                      ? 'bg-indigo-50 text-indigo-950 font-semibold shadow-xs'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full border border-black/15 shadow-inner shrink-0"
                      style={{ backgroundColor: s.background?.color || '#14141a' }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Rename icon */}
                    <button
                      onClick={(e) => handleStartRename(e, s.id, s.name)}
                      title="Rename"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {/* Delete icon */}
                    {scenes.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(e, s.id)}
                        title="Delete Scene"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-100 text-neutral-400 hover:text-rose-600 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 ml-0.5 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1.5 mt-1 border-t border-neutral-100">
            <button
              onClick={handleCreate}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> New Wallpaper
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
