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

/** Minimal toggle switch with sketchbook ink styling */
const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-sk border-2 border-line transition-colors duration-150 focus-visible:outline-none",
      checked ? "bg-brand-blue" : "bg-paper",
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block h-3.5 w-3.5 rounded-sk-sm bg-ink shadow-sm transition-transform duration-150 m-0.5",
        checked ? "translate-x-4 bg-on-accent" : "translate-x-0 bg-ink/60",
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
      <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-surface text-ink border-2 border-line rounded-sk-lg p-5 shadow-hard max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-line">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-blue" />
            <h3 className="font-hand text-base font-bold text-ink">Widgets & Accessories</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sk-sm text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Toggle Widgets */}
        <div className="py-3 flex flex-col gap-0 border-b border-line/20 text-xs divide-y divide-line/10">
          {/* Master All Widgets Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              {allWidgetsOff ? (
                <EyeOff className="w-3.5 h-3.5 text-muted" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-brand-green" />
              )}
              <span className="font-hand font-bold text-ink">All Widgets</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  allWidgetsOff ? turnOnAllWidgets() : turnOffAllWidgets()
                }
                className="text-[11px] font-hand font-bold text-ink px-2 py-0.5 rounded-sk bg-paper border border-line/30 hover:border-line transition-colors cursor-pointer"
              >
                {allWidgetsOff ? "Turn on all" : "Turn off all"}
              </button>
              <Toggle checked={!allWidgetsOff} onChange={toggleAllWidgets} />
            </div>
          </div>

          {/* Clock Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-muted" />
              <span className="font-sans text-xs text-ink">Digital Clock</span>
            </div>
            <div className="flex items-center gap-2.5">
              {showClock && (
                <div className="flex items-center bg-paper border border-line/30 p-0.5 rounded-sk-sm text-[10px] font-mono">
                  <button
                    onClick={() => setClockFormat("12h")}
                    className={cn(
                      "px-1.5 py-0.5 rounded-sk-sm font-medium transition-all cursor-pointer",
                      clockFormat === "12h"
                        ? "bg-brand-blue text-on-accent font-bold"
                        : "text-ink/70",
                    )}
                  >
                    12h
                  </button>
                  <button
                    onClick={() => setClockFormat("24h")}
                    className={cn(
                      "px-1.5 py-0.5 rounded-sk-sm font-medium transition-all cursor-pointer",
                      clockFormat === "24h"
                        ? "bg-brand-blue text-on-accent font-bold"
                        : "text-ink/70",
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
              <Calendar className="w-3.5 h-3.5 text-muted" />
              <span className="font-sans text-xs text-ink">Date & Day</span>
            </div>
            <Toggle checked={showDate} onChange={setShowDate} />
          </div>

          {/* Search Bar Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Search className="w-3.5 h-3.5 text-muted" />
              <span className="font-sans text-xs text-ink">Search Bar</span>
            </div>
            <div className="flex items-center gap-2.5">
              {showSearch && <SearchEngineDropdown />}
              <Toggle checked={showSearch} onChange={setShowSearch} />
            </div>
          </div>

          {/* Quick Links Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Link2 className="w-3.5 h-3.5 text-muted" />
              <span className="font-sans text-xs text-ink">Quick Links</span>
            </div>
            <Toggle checked={showQuickLinks} onChange={setShowQuickLinks} />
          </div>
        </div>

        {/* Section 2: Quick Links Manager */}
        <div className="pt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-hand font-bold text-muted">
              Quick links
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-sk-sm bg-paper border border-line/30 text-ink">
              {quickLinks.length}/{MAX_QUICK_LINKS}
            </span>
          </div>

          {/* Links List */}
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {quickLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-2 rounded-sk bg-paper border border-line/30 hover:border-line transition-colors"
              >
                <span className="font-sans font-medium truncate max-w-[260px] text-ink">
                  {link.title}
                </span>
                <button
                  onClick={() => removeQuickLink(link.id)}
                  className="p-1 rounded-sk-sm hover:bg-danger/10 text-muted hover:text-danger hover:border-danger transition-colors cursor-pointer"
                  title="Remove shortcut"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Quick Link Form */}
          {quickLinks.length >= MAX_QUICK_LINKS ? (
            <div className="py-2 px-3 bg-paper rounded-sk text-xs text-muted font-sans text-center border border-line/20">
              Maximum {MAX_QUICK_LINKS} links reached
            </div>
          ) : (
            <form
              onSubmit={handleAddQuickLink}
              className="pt-2 border-t border-line/20 flex flex-col gap-2"
            >
              <div className="text-xs font-hand font-bold text-muted">
                Add shortcut
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title (e.g. GitHub)"
                  className="flex-1 px-2.5 py-1.5 text-xs font-sans rounded-sk border-2 border-line/40 bg-paper text-ink outline-none focus-visible:outline-brand-blue transition-colors"
                />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="flex-1 px-2.5 py-1.5 text-xs font-sans rounded-sk border-2 border-line/40 bg-paper text-ink outline-none focus-visible:outline-brand-blue transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-green text-on-accent font-hand font-bold text-xs rounded-sk border-2 border-line shadow-hard-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t-2 border-line flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-xs font-hand font-bold text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-brand-green text-on-accent font-hand font-bold rounded-sk text-xs border-2 border-line shadow-hard hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
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
