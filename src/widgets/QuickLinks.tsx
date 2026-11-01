import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useWidgetStore, MAX_QUICK_LINKS } from "../store/useWidgetStore";
import { useAppStore } from "../store/useAppStore";
import { isColorLight, cn } from "../lib/utils";

interface QuickLinksProps {
  isLight?: boolean;
}

export const QuickLinks: React.FC<QuickLinksProps> = ({
  isLight: propIsLight,
}) => {
  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);
  const quickLinks = useWidgetStore((s) => s.quickLinks);
  const addQuickLink = useWidgetStore((s) => s.addQuickLink);
  const removeQuickLink = useWidgetStore((s) => s.removeQuickLink);
  const background = useAppStore((s) => s.background);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const canAddMore = quickLinks.length < MAX_QUICK_LINKS;

  useEffect(() => {
    if (!isAdding) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsAdding(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdding]);

  const isLight =
    propIsLight !== undefined
      ? propIsLight
      : !(background?.type === "image" && background?.imageUrl) &&
        isColorLight(background?.color || "#14141a");

  if (!showQuickLinks) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !canAddMore) return;
    addQuickLink(newTitle, newUrl);
    setNewTitle("");
    setNewUrl("");
    setIsAdding(false);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap max-w-xl mx-auto select-none">
      {quickLinks.map((link) => {
        const domain = getDomain(link.url);
        const faviconUrl = domain
          ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
          : "";

        return (
          <div key={link.id} className="relative group">
            <a
              href={link.url}
              title={link.title}
              className={cn(
                "flex flex-col items-center gap-1.5 w-18 p-2 rounded-sk border-2 transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px]",
                isLight
                  ? "bg-white text-[#0E1A1F] border-[#0E1A1F] shadow-[2px_2px_0_#0E1A1F] hover:bg-[#F6FAF8]"
                  : "bg-[#15262D] text-[#EAF4F1] border-[#3D525A] shadow-[2px_2px_0_#000000] hover:bg-[#0E1A1F]",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-sk-sm flex items-center justify-center overflow-hidden border",
                  isLight
                    ? "bg-[#F6FAF8] border-[#0E1A1F]/20"
                    : "bg-[#0E1A1F] border-[#3D525A]/60",
                )}
              >
                <img
                  src={faviconUrl}
                  alt={link.title}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <span className="text-[11px] font-hand font-bold truncate max-w-full">
                {link.title}
              </span>
            </a>

            {/* Remove button on hover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeQuickLink(link.id);
              }}
              title="Remove shortcut"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-sk-sm bg-danger text-white border border-line flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-hard-sm cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Add new link button (shown when below limit) */}
      {canAddMore && (
        <button
          onClick={() => setIsAdding(true)}
          title="Add Shortcut"
          className={cn(
            "flex flex-col items-center justify-center w-18 h-[76px] p-2 rounded-sk border-2 transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer",
            isLight
              ? "bg-white text-[#0E1A1F] border-[#0E1A1F] shadow-[2px_2px_0_#0E1A1F] hover:bg-[#F6FAF8]"
              : "bg-[#15262D] text-[#EAF4F1] border-[#3D525A] shadow-[2px_2px_0_#000000] hover:bg-[#0E1A1F]",
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-sk-sm flex items-center justify-center border",
              isLight
                ? "bg-[#F6FAF8] border-[#0E1A1F]/20"
                : "bg-[#0E1A1F] border-[#3D525A]/60",
            )}
          >
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-hand font-bold mt-1">
            Add
          </span>
        </button>
      )}

      {/* Add Shortcut Modal */}
      {isAdding && (
        <div
          onClick={() => setIsAdding(false)}
          className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface text-ink border-2 border-line rounded-sk-lg p-5 w-full max-w-sm shadow-hard"
          >
            <h3 className="font-hand text-base font-bold text-ink mb-3">
              Add Shortcut
            </h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-hand font-bold text-muted block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. GitHub"
                  className="w-full px-3 py-2 text-xs font-sans rounded-sk border-2 border-line/40 bg-paper text-ink outline-none focus-visible:outline-brand-blue"
                />
              </div>
              <div>
                <label className="text-xs font-hand font-bold text-muted block mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full px-3 py-2 text-xs font-sans rounded-sk border-2 border-line/40 bg-paper text-ink outline-none focus-visible:outline-brand-blue"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-hand font-bold rounded-sk border-2 border-line/30 bg-paper hover:bg-surface text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-hand font-bold bg-brand-green text-on-accent rounded-sk border-2 border-line shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  Add Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
