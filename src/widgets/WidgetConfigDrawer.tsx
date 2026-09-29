import React, { useState } from "react";
import {
  X,
  SlidersHorizontal,
  Clock,
  Calendar,
  Search,
  Link2,
  Trash2,
  Plus,
} from "lucide-react";
import { useWidgetStore, MAX_QUICK_LINKS } from "../store/useWidgetStore";
import { PrivacyPolicyDialog } from "../components/PrivacyPolicyDialog";
import { SearchEngineDropdown } from "./settings/SearchEngineDropdown";
import { cn } from "../lib/utils";

interface WidgetConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WidgetConfigDrawer: React.FC<WidgetConfigDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const showClock = useWidgetStore((s) => s.showClock);
  const setShowClock = useWidgetStore((s) => s.setShowClock);
  const clockFormat = useWidgetStore((s) => s.clockFormat);
  const setClockFormat = useWidgetStore((s) => s.setClockFormat);
  const showDate = useWidgetStore((s) => s.showDate);
  const setShowDate = useWidgetStore((s) => s.setShowDate);

  const showSearch = useWidgetStore((s) => s.showSearch);
  const setShowSearch = useWidgetStore((s) => s.setShowSearch);

  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);
  const setShowQuickLinks = useWidgetStore((s) => s.setShowQuickLinks);
  const quickLinks = useWidgetStore((s) => s.quickLinks);
  const addQuickLink = useWidgetStore((s) => s.addQuickLink);
  const removeQuickLink = useWidgetStore((s) => s.removeQuickLink);

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  if (!isOpen) return null;

  const handleAddQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || quickLinks.length >= MAX_QUICK_LINKS) return;
    addQuickLink(newTitle, newUrl);
    setNewTitle("");
    setNewUrl("");
  };

  return (
    <>
      <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 text-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold">Widgets & Accessories</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Toggle Widgets */}
        <div className="py-3 flex flex-col gap-3.5 border-b border-neutral-100 text-xs">
          {/* Clock Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Digital Clock</span>
            </div>
            <div className="flex items-center gap-2">
              {showClock && (
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setClockFormat("12h")}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                      clockFormat === "12h"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-neutral-600",
                    )}
                  >
                    12h
                  </button>
                  <button
                    onClick={() => setClockFormat("24h")}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                      clockFormat === "24h"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-neutral-600",
                    )}
                  >
                    24h
                  </button>
                </div>
              )}
              <input
                type="checkbox"
                checked={showClock}
                onChange={(e) => setShowClock(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Date Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Date & Day</span>
            </div>
            <input
              type="checkbox"
              checked={showDate}
              onChange={(e) => setShowDate(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Search Bar Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Search Bar</span>
            </div>
            <div className="flex items-center gap-2">
              {showSearch && <SearchEngineDropdown />}
              <input
                type="checkbox"
                checked={showSearch}
                onChange={(e) => setShowSearch(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Links Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Quick Links</span>
            </div>
            <input
              type="checkbox"
              checked={showQuickLinks}
              onChange={(e) => setShowQuickLinks(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Section 2: Quick Links Manager & Addition */}
        <div className="pt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Manage Quick Links
            </div>
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              {quickLinks.length}/{MAX_QUICK_LINKS}
            </span>
          </div>

          {/* Links List */}
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {quickLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200/80 hover:bg-neutral-100 transition-colors"
              >
                <span className="font-medium truncate max-w-[260px]">
                  {link.title}
                </span>
                <button
                  onClick={() => removeQuickLink(link.id)}
                  className="p-1 rounded-lg hover:bg-rose-100 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove shortcut"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Quick Link Form */}
          {quickLinks.length >= MAX_QUICK_LINKS ? (
            <div className="pt-2 border-t border-neutral-100 text-center py-2.5 px-3 bg-neutral-50 rounded-xl text-xs text-neutral-500 border border-neutral-200/60 font-medium">
              Maximum {MAX_QUICK_LINKS} quick links reached
            </div>
          ) : (
            <form
              onSubmit={handleAddQuickLink}
              className="pt-2 border-t border-neutral-100 flex flex-col gap-2"
            >
              <div className="text-xs font-semibold text-neutral-700">
                Add New Shortcut
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title (e.g. GitHub)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 outline-none focus:border-indigo-600"
                />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer: Privacy Policy */}
        <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-[11px] text-neutral-400 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      <PrivacyPolicyDialog
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </>
  );
};
