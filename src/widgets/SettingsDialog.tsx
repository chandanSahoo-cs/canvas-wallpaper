import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  Search,
  Link2,
  Move,
  RotateCcw,
  Eye,
  EyeOff,
  Compass,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useWidgetStore } from "../store/useWidgetStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { useAppStore } from "../store/useAppStore";
import { PrivacyPolicyDialog } from "../components/PrivacyPolicyDialog";
import { SearchEngineDropdown } from "./settings/SearchEngineDropdown";
import { cn } from "../lib/utils";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);
  const resetWidgetPositions = useWidgetStore((s) => s.resetWidgetPositions);

  const allWidgetsOff = !showClock && !showDate && !showSearch && !showQuickLinks;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="bg-surface text-ink border-2 border-line rounded-sk-lg p-6 w-full max-w-md shadow-hard max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon/48.png"
              alt=""
              aria-hidden="true"
              className="w-5 h-5 object-contain"
            />
            <h2 id="settings-dialog-title" className="font-hand text-lg font-bold text-ink leading-tight">
              Settings & Widgets
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-sk-sm text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 py-4 overflow-y-auto pr-1">
          {/* Master Control: Turn off / on every widget */}
          <div className="flex items-center justify-between pb-3.5 border-b border-line/20">
            <div className="flex items-center gap-2.5">
              {allWidgetsOff ? (
                <EyeOff className="w-4 h-4 text-muted" />
              ) : (
                <Eye className="w-4 h-4 text-brand-green" />
              )}
              <div>
                <div className="text-sm font-hand font-bold text-ink">All Widgets</div>
                <div className="text-xs font-sans text-muted">
                  Toggle all screen accessories
                </div>
              </div>
            </div>
            <button
              onClick={allWidgetsOff ? turnOnAllWidgets : turnOffAllWidgets}
              className={cn(
                "py-1.5 px-3 rounded-sk font-hand font-bold text-xs border-2 transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px]",
                allWidgetsOff
                  ? "bg-brand-green text-on-accent border-line shadow-hard-sm"
                  : "bg-paper text-ink border-line/30 hover:border-line",
              )}
            >
              {allWidgetsOff ? "Show All" : "Hide All"}
            </button>
          </div>

          {/* Individual Widget Toggles */}
          <div className="flex flex-col gap-3">
            {/* Clock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-muted" />
                <span className="text-xs font-sans font-medium text-ink">Digital Clock</span>
              </div>
              <div className="flex items-center gap-2">
                {showClock && (
                  <div className="flex items-center bg-paper border border-line/40 p-0.5 rounded-sk-sm text-[10px] font-mono">
                    <button
                      onClick={() => setClockFormat("12h")}
                      className={cn(
                        "px-1.5 py-0.5 rounded-sk-sm font-medium transition-all cursor-pointer",
                        clockFormat === "12h"
                          ? "bg-brand-blue text-on-accent font-bold"
                          : "text-ink/70 hover:text-ink",
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
                          : "text-ink/70 hover:text-ink",
                      )}
                    >
                      24h
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowClock(!showClock)}
                  className={cn(
                    "py-1 px-2.5 rounded-sk font-hand font-bold text-xs border-2 transition-all cursor-pointer",
                    showClock
                      ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                      : "bg-paper text-ink/70 border-line/30 hover:border-line",
                  )}
                >
                  {showClock ? "On" : "Off"}
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-muted" />
                <span className="text-xs font-sans font-medium text-ink">Date & Day</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDate(!showDate)}
                className={cn(
                  "py-1 px-2.5 rounded-sk font-hand font-bold text-xs border-2 transition-all cursor-pointer",
                  showDate
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "bg-paper text-ink/70 border-line/30 hover:border-line",
                )}
              >
                {showDate ? "On" : "Off"}
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-muted" />
                <span className="text-xs font-sans font-medium text-ink">Search Bar</span>
              </div>
              <div className="flex items-center gap-2">
                {showSearch && <SearchEngineDropdown />}
                <button
                  type="button"
                  onClick={() => setShowSearch(!showSearch)}
                  className={cn(
                    "py-1 px-2.5 rounded-sk font-hand font-bold text-xs border-2 transition-all cursor-pointer",
                    showSearch
                      ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                      : "bg-paper text-ink/70 border-line/30 hover:border-line",
                  )}
                >
                  {showSearch ? "On" : "Off"}
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Link2 className="w-4 h-4 text-muted" />
                <span className="text-xs font-sans font-medium text-ink">Quick Links</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickLinks(!showQuickLinks)}
                className={cn(
                  "py-1 px-2.5 rounded-sk font-hand font-bold text-xs border-2 transition-all cursor-pointer",
                  showQuickLinks
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "bg-paper text-ink/70 border-line/30 hover:border-line",
                )}
              >
                {showQuickLinks ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* Widget Layout & Alignment */}
          <div className="flex flex-col gap-2 pt-3.5 border-t border-line/20">
            <div className="flex items-center justify-between">
              <div className="text-sm font-hand font-bold text-ink">
                Layout & Placement
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <button
                onClick={() => {
                  onClose();
                  setIsLayoutMode(true);
                }}
                className="flex-1 py-1.5 px-3 rounded-sk bg-paper hover:bg-surface text-ink font-hand font-bold text-xs flex items-center justify-center gap-2 border-2 border-line shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Drag & Position Widgets</span>
              </button>
              <button
                onClick={resetWidgetPositions}
                title="Reset widgets to default layout"
                className="p-1.5 rounded-sk border-2 border-line bg-paper hover:bg-surface text-ink shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interface Theme (System / Light / Dark) */}
          <div className="flex flex-col gap-2 pt-3.5 border-t border-line/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-brand-blue" />
                <div>
                  <div className="text-sm font-hand font-bold text-ink">Appearance Theme</div>
                  <div className="text-xs font-sans text-muted">
                    Chrome theme mode (independent from wallpaper)
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-paper border-2 border-line rounded-sk">
              <button
                type="button"
                onClick={() => setThemeMode("system")}
                className={cn(
                  "py-1.5 px-2.5 rounded-sk-sm text-xs font-hand font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2",
                  themeMode === "system"
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "border-transparent text-ink/70 hover:text-ink hover:bg-surface/50",
                )}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={cn(
                  "py-1.5 px-2.5 rounded-sk-sm text-xs font-hand font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2",
                  themeMode === "light"
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "border-transparent text-ink/70 hover:text-ink hover:bg-surface/50",
                )}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={cn(
                  "py-1.5 px-2.5 rounded-sk-sm text-xs font-hand font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2",
                  themeMode === "dark"
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "border-transparent text-ink/70 hover:text-ink hover:bg-surface/50",
                )}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Feature Walkthrough Tour */}
          <div className="flex items-center justify-between pt-3.5 border-t border-line/20">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-muted" />
              <div>
                <div className="text-sm font-hand font-bold text-ink">Feature Walkthrough</div>
                <div className="text-xs font-sans text-muted">
                  Interactive guided tour
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                useOnboardingStore.getState().resetTour();
              }}
              className="py-1.5 px-3 rounded-sk bg-paper hover:bg-surface text-ink font-hand font-bold text-xs border-2 border-line shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              Start Tour
            </button>
          </div>
        </div>

        <div className="pt-3.5 border-t-2 border-line flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-xs font-hand font-bold text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      <PrivacyPolicyDialog
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};
