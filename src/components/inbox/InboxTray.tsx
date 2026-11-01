import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  Inbox,
  LayoutGrid,
  Plus,
  RotateCcw,
  Settings,
  X,
} from "lucide-react";
import { useInboxStore } from "../../lib/inbox/store";
import { InboxItem } from "../../lib/inbox/types";
import { cn } from "../../lib/utils";
import { InboxItemCard } from "./InboxItemCard";

interface InboxTrayProps {
  onOpenSettings?: () => void;
}

export const InboxTray: React.FC<InboxTrayProps> = ({ onOpenSettings }) => {
  const isOpen = useInboxStore((s) => s.isOpen);
  const setIsOpen = useInboxStore((s) => s.setIsOpen);
  const items = useInboxStore((s) => s.items);
  const unreadCount = useInboxStore((s) => s.unreadCount);
  const filterState = useInboxStore((s) => s.filterState);
  const setFilterState = useInboxStore((s) => s.setFilterState);
  const hasHint = useInboxStore((s) => s.hasHint);
  const lastDismissed = useInboxStore((s) => s.lastDismissed);

  const quickAdd = useInboxStore((s) => s.quickAdd);
  const dismiss = useInboxStore((s) => s.dismiss);
  const undoDismiss = useInboxStore((s) => s.undoDismiss);
  const deleteItem = useInboxStore((s) => s.deleteItem);
  const placeItem = useInboxStore((s) => s.placeItem);
  const placeAllAsGrid = useInboxStore((s) => s.placeAllAsGrid);
  const clearHint = useInboxStore((s) => s.clearHint);

  const [quickInput, setQuickInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await quickAdd(quickInput.trim());
      setQuickInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((it) => {
    if (filterState === "all") return it.state !== "dismissed";
    return it.state === filterState;
  });

  const activeUnplacedCount = items.filter(
    (it) => it.state === "new" || it.state === "placed",
  ).length;

  return (
    <div
      id="inbox-tray-panel"
      data-tour="inbox-tray"
      className="fixed top-20 right-4 z-30 w-80 max-h-[calc(100vh-6rem)] bg-surface text-ink border-2 border-line shadow-hard rounded-sk-lg p-3 flex flex-col gap-2.5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-150 select-none"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between gap-1 pb-1 border-b-2 border-line/20 shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-brand-blue" />
          <h3 className="font-hand font-bold text-sm text-ink tracking-wide">
            Inbox
          </h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-sk-sm bg-brand-blue text-on-accent font-hand font-bold text-[10px]">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {activeUnplacedCount > 0 && (
            <button
              type="button"
              title="Place all items as grid onto board"
              aria-label="Place all as grid"
              onClick={placeAllAsGrid}
              className="px-2 py-1 rounded-sk bg-brand-green text-on-accent font-hand font-bold text-xs border border-line shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Grid All</span>
            </button>
          )}

          <button
            type="button"
            title="Close Inbox (I)"
            aria-label="Close Inbox"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-sk text-muted hover:text-ink hover:bg-paper transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. One-Time Capture Hint Banner */}
      {hasHint && (
        <div className="p-2.5 rounded-sk bg-brand-blue/10 border-2 border-brand-blue text-ink flex flex-col gap-1.5 shrink-0 text-xs">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 font-hand font-bold text-blue-text">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Web Capture Tip</span>
            </div>
            <button
              onClick={clearHint}
              className="text-muted hover:text-ink cursor-pointer"
              title="Dismiss note"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="font-sans text-[11px] text-ink/80 leading-snug">
            Some images were saved as links because the site blocked cross-origin
            requests. Enable broader web capture in Settings.
          </p>
          {onOpenSettings && (
            <button
              onClick={() => {
                clearHint();
                onOpenSettings();
              }}
              className="mt-1 self-start px-2 py-0.5 rounded-sk bg-surface border border-line font-hand font-bold text-[11px] text-ink shadow-hard-sm hover:bg-paper cursor-pointer flex items-center gap-1"
            >
              <Settings className="w-3 h-3 text-brand-blue" />
              <span>Open Settings</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Quick-Add Field */}
      <form onSubmit={handleQuickSubmit} className="flex items-center gap-1.5 shrink-0">
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="Paste URL or type a note..."
          className="flex-1 px-2.5 py-1.5 text-xs font-sans rounded-sk bg-paper text-ink border-2 border-line/30 focus:border-brand-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickInput.trim() || isSubmitting}
          title="Add to Inbox (Enter)"
          aria-label="Add to Inbox"
          className="h-8 px-2.5 rounded-sk bg-brand-blue text-on-accent font-hand font-bold text-xs border-2 border-line shadow-hard-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* 4. Filter Tabs */}
      <div className="flex items-center bg-paper p-0.5 rounded-sk border border-line/30 text-xs font-hand shrink-0">
        {(["all", "new", "placed", "dismissed"] as const).map((tab) => {
          const count = items.filter((it) => {
            if (tab === "all") return it.state !== "dismissed";
            return it.state === tab;
          }).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterState(tab)}
              className={cn(
                "flex-1 py-1 rounded-sk-sm font-bold capitalize transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]",
                filterState === tab
                  ? "bg-brand-blue text-on-accent border border-line shadow-hard-sm"
                  : "text-ink/70 hover:text-ink hover:bg-surface/50 border border-transparent",
              )}
            >
              <span>{tab}</span>
              {count > 0 && <span className="opacity-80 text-[10px]">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* 5. Scrollable Items List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
        {filteredItems.length === 0 ? (
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-1.5 text-muted">
            <Inbox className="w-8 h-8 opacity-40 mb-1" />
            <p className="font-hand font-bold text-xs text-ink/70">
              {filterState === "dismissed"
                ? "No dismissed items"
                : "Your inbox is clear!"}
            </p>
            <p className="font-sans text-[11px] max-w-[200px]">
              Right-click any web image, selection, or page to save it directly
              into PaperTab.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <InboxItemCard
              key={item.id}
              item={item}
              onPlace={(it) => placeItem(it)}
              onDismiss={(id) => dismiss(id)}
              onRestore={(id) => undoDismiss()}
              onDelete={(id) => deleteItem(id)}
            />
          ))
        )}
      </div>

      {/* 6. Undo Toast */}
      {lastDismissed && (
        <div className="p-2 rounded-sk bg-surface border-2 border-line shadow-hard flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-100">
          <span className="font-sans text-xs text-ink truncate">
            Item dismissed
          </span>
          <button
            type="button"
            onClick={undoDismiss}
            className="px-2 py-0.5 rounded-sk bg-brand-blue text-on-accent font-hand font-bold text-xs border border-line hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}
    </div>
  );
};
