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
  Eye,
  EyeOff,
} from "lucide-react";
import { useWidgetStore, MAX_QUICK_LINKS } from "../store/useWidgetStore";
import { PrivacyPolicyDialog } from "../components/PrivacyPolicyDialog";
import { SearchEngineDropdown } from "./settings/SearchEngineDropdown";
import { cn } from "../lib/utils";

interface WidgetConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Minimal toggle switch — no extra dependencies */
const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none",
      checked ? "bg-neutral-900" : "bg-neutral-300",
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0",
      )}
    />
  </button>
);

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
  const turnOffAllWidgets = useWidgetStore((s) => s.turnOffAllWidgets);
  const turnOnAllWidgets = useWidgetStore((s) => s.turnOnAllWidgets);
  const toggleAllWidgets = useWidgetStore((s) => s.toggleAllWidgets);
  const quickLinks = useWidgetStore((s) => s.quickLinks);
  const addQuickLink = useWidgetStore((s) => s.addQuickLink);
  const removeQuickLink = useWidgetStore((s) => s.removeQuickLink);

  const allWidgetsOff = !showClock && !showDate && !showSearch && !showQuickLinks;

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
      <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-neutral-200 text-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-900">Widgets</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Toggle Widgets */}
        <div className="py-3 flex flex-col gap-0 border-b border-neutral-100 text-xs divide-y divide-neutral-100">
          {/* Master All Widgets Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              {allWidgetsOff ? (
                <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span className="font-semibold text-neutral-800">All Widgets</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  allWidgetsOff ? turnOnAllWidgets() : turnOffAllWidgets()
                }
                className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                {allWidgetsOff ? "Turn on all" : "Turn off all"}
              </button>
              <Toggle checked={!allWidgetsOff} onChange={toggleAllWidgets} />
            </div>
          </div>

          {/* Clock Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium text-neutral-700">Digital Clock</span>
            </div>
            <div className="flex items-center gap-2.5">
              {showClock && (
                <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setClockFormat("12h")}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                      clockFormat === "12h"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500",
                    )}
                  >
                    12h
                  </button>
                  <button
                    onClick={() => setClockFormat("24h")}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                      clockFormat === "24h"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500",
                    )}
                  >
                    24h
                  </button>
                </div>
              )}
              <Toggle checked={showClock} onChange={setShowClock} />
            </div>
          </div>

          {/* Date Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium text-neutral-700">Date & Day</span>
            </div>
            <Toggle checked={showDate} onChange={setShowDate} />
          </div>

          {/* Search Bar Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium text-neutral-700">Search Bar</span>
            </div>
            <div className="flex items-center gap-2.5">
              {showSearch && <SearchEngineDropdown />}
              <Toggle checked={showSearch} onChange={setShowSearch} />
            </div>
          </div>

          {/* Quick Links Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Link2 className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium text-neutral-700">Quick Links</span>
            </div>
            <Toggle checked={showQuickLinks} onChange={setShowQuickLinks} />
          </div>
        </div>

        {/* Section 2: Quick Links Manager */}
        <div className="pt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">
              Quick links
            </span>
            <span className="text-[11px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
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
                <span className="font-medium truncate max-w-[260px] text-neutral-700">
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
            <div className="py-2.5 px-3 bg-neutral-50 rounded-xl text-xs text-neutral-400 font-medium text-center border border-neutral-200/60">
              Maximum {MAX_QUICK_LINKS} links reached
            </div>
          ) : (
            <form
              onSubmit={handleAddQuickLink}
              className="pt-2 border-t border-neutral-100 flex flex-col gap-2"
            >
              <div className="text-xs font-medium text-neutral-500">
                Add shortcut
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title (e.g. GitHub)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 outline-none focus:border-neutral-400 transition-colors"
                />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 outline-none focus:border-neutral-400 transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-700 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
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
