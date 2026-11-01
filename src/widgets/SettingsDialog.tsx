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
  RefreshCw,
  Globe,
  Shield,
  Shuffle,
  Trash2,
  Archive,
  HardDrive,
} from "lucide-react";
import { useResurfaceStore } from "../lib/resurface/store";
import { BackupModal } from "../components/backup/BackupModal";
import { StorageHealthModal } from "../components/storage/StorageHealthModal";
import {
  requestHostPermission,
  removeHostPermission,
  subscribeHostPermission,
} from "../lib/permissions";
import { useSceneStore } from "../store/useSceneStore";
import { loadAllLibraryItems } from "../lib/library/crossReference";
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
  const [isRebuildingIndex, setIsRebuildingIndex] = useState(false);
  const [indexRebuiltMessage, setIndexRebuiltMessage] = useState(false);
  const [hasCapturePermission, setHasCapturePermission] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);

  useEffect(() => {
    return subscribeHostPermission(setHasCapturePermission);
  }, []);

  const handleRebuildIndex = async () => {
    setIsRebuildingIndex(true);
    try {
      const scenes = useSceneStore.getState().scenes;
      await loadAllLibraryItems(scenes);
      setIndexRebuiltMessage(true);
      setTimeout(() => setIndexRebuiltMessage(false), 2500);
    } catch (err) {
      console.error("Failed to rebuild search index:", err);
    } finally {
      setIsRebuildingIndex(false);
    }
  };
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);

  const resurfaceConfig = useResurfaceStore((s) => s.config);
  const setResurfaceMode = useResurfaceStore((s) => s.setMode);
  const setResurfaceFit = useResurfaceStore((s) => s.setFit);
  const setResurfaceShowCaption = useResurfaceStore((s) => s.setShowCaption);
  const removeExclusion = useResurfaceStore((s) => s.removeExclusion);
  const clearExclusions = useResurfaceStore((s) => s.clearExclusions);

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
        data-tour="settings-dialog"
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
          <div data-tour="widgets-section" className="flex flex-col gap-3">
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
          <div data-tour="widget-layout-section" className="flex flex-col gap-2 pt-3.5 border-t border-line/20">
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
          <div data-tour="theme-section" className="flex flex-col gap-2 pt-3.5 border-t border-line/20">
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

          {/* New Tab Shows (Resurfacing) */}
          <div data-tour="resurface-settings" className="flex flex-col gap-2 pt-3.5 border-t border-line/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shuffle className="w-4 h-4 text-brand-blue" />
                <div>
                  <div className="text-sm font-hand font-bold text-ink">New Tab Shows</div>
                  <div className="text-xs font-sans text-muted">
                    Display pick when opening a new tab
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-paper border-2 border-line rounded-sk">
              <button
                type="button"
                onClick={() => setResurfaceMode("current")}
                className={cn(
                  "py-1.5 px-2 rounded-sk-sm text-xs font-hand font-bold transition-all cursor-pointer border-2",
                  resurfaceConfig.mode === "current"
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "border-transparent text-ink/70 hover:text-ink hover:bg-surface/50",
                )}
              >
                Current Board (default)
              </button>
              <button
                type="button"
                onClick={() => setResurfaceMode("shuffle")}
                className={cn(
                  "py-1.5 px-2 rounded-sk-sm text-xs font-hand font-bold transition-all cursor-pointer border-2",
                  resurfaceConfig.mode === "shuffle"
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "border-transparent text-ink/70 hover:text-ink hover:bg-surface/50",
                )}
              >
                Shuffle Boards
              </button>
              <button
                type="button"
                onClick={() => setResurfaceMode("random_item")}
                className={cn(
                  "py-1.5 px-2 rounded-sk-sm text-xs font-hand font-bold transition-all cursor-pointer border-2",
                  resurfaceConfig.mode === "random_item"
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "border-transparent text-ink/70 hover:text-ink hover:bg-surface/50",
                )}
              >
                Random Item
              </button>
              <button
                type="button"
                onClick={() => setResurfaceMode("daily")}
                className={cn(
                  "py-1.5 px-2 rounded-sk-sm text-xs font-hand font-bold transition-all cursor-pointer border-2",
                  resurfaceConfig.mode === "daily"
                    ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                    : "border-transparent text-ink/70 hover:text-ink hover:bg-surface/50",
                )}
              >
                Daily Pick
              </button>
            </div>

            {/* Fit and Caption controls for item mode */}
            {(resurfaceConfig.mode === "random_item" || resurfaceConfig.mode === "daily") && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-sans text-muted">Fit:</span>
                  <div className="inline-flex bg-paper border border-line/30 rounded-sk p-0.5 text-xs font-hand font-bold">
                    <button
                      type="button"
                      onClick={() => setResurfaceFit("cover")}
                      className={cn(
                        "px-2 py-0.5 rounded-sk-sm cursor-pointer transition-all",
                        resurfaceConfig.fit === "cover"
                          ? "bg-brand-blue text-on-accent"
                          : "text-ink/70 hover:text-ink",
                      )}
                    >
                      Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => setResurfaceFit("contain")}
                      className={cn(
                        "px-2 py-0.5 rounded-sk-sm cursor-pointer transition-all",
                        resurfaceConfig.fit === "contain"
                          ? "bg-brand-blue text-on-accent"
                          : "text-ink/70 hover:text-ink",
                      )}
                    >
                      Contain
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResurfaceShowCaption(!resurfaceConfig.showCaption)}
                  className={cn(
                    "py-1 px-2.5 rounded-sk font-hand font-bold text-xs border-2 transition-all cursor-pointer",
                    resurfaceConfig.showCaption
                      ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                      : "bg-paper text-ink/70 border-line/30 hover:border-line",
                  )}
                >
                  {resurfaceConfig.showCaption ? "Caption On" : "Caption Off"}
                </button>
              </div>
            )}

            {/* Exclusion List Management */}
            {resurfaceConfig.exclusions.length > 0 && (
              <div className="mt-1 p-2 bg-paper/60 border border-line/30 rounded-sk flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium text-ink">
                    Never Show Again ({resurfaceConfig.exclusions.length})
                  </span>
                  <button
                    type="button"
                    onClick={clearExclusions}
                    className="text-[11px] font-hand font-bold text-danger hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1 pr-1">
                  {resurfaceConfig.exclusions.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sk-sm bg-surface border border-line/30 text-[10px] font-mono text-ink"
                    >
                      <span className="max-w-[120px] truncate">{id}</span>
                      <button
                        type="button"
                        onClick={() => removeExclusion(id)}
                        className="text-muted hover:text-danger cursor-pointer"
                        title="Remove from exclusions"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rebuild Search Index */}
          <div className="flex items-center justify-between pt-3.5 border-t border-line/20">
            <div className="flex items-center gap-2.5">
              <RefreshCw className={cn("w-4 h-4 text-muted", isRebuildingIndex && "animate-spin text-brand-blue")} />
              <div>
                <div className="text-sm font-hand font-bold text-ink">Search Index</div>
                <div className="text-xs font-sans text-muted">
                  {indexRebuiltMessage ? "Index up to date!" : "Re-index all assets and text across boards"}
                </div>
              </div>
            </div>
            <button
              onClick={handleRebuildIndex}
              disabled={isRebuildingIndex}
              className="py-1.5 px-3 rounded-sk bg-paper hover:bg-surface text-ink font-hand font-bold text-xs border-2 border-line shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
            >
              {isRebuildingIndex ? "Rebuilding..." : indexRebuiltMessage ? "Done" : "Rebuild"}
            </button>
          </div>

          {/* Web Capture & Host Permissions */}
          <div data-tour="web-capture-permission" className="flex flex-col gap-2 pt-3.5 border-t border-line/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-brand-blue shrink-0" />
                <div>
                  <div className="text-sm font-hand font-bold text-ink flex items-center gap-2">
                    <span>Web Image Capture</span>
                    <span
                      className={cn(
                        "text-[10px] font-mono px-1.5 py-0.2 rounded-sk-sm border",
                        hasCapturePermission
                          ? "bg-brand-green/20 text-brand-green border-brand-green/40 font-bold"
                          : "bg-paper text-muted border-line/30",
                      )}
                    >
                      {hasCapturePermission ? "Allowed" : "Restricted"}
                    </span>
                  </div>
                  <div className="text-xs font-sans text-muted">
                    Allow saving images directly from any site. Items are saved 100% locally to your Inbox.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {hasCapturePermission ? (
                <button
                  type="button"
                  onClick={async () => {
                    await removeHostPermission();
                    setHasCapturePermission(false);
                  }}
                  className="py-1.5 px-3 rounded-sk bg-paper hover:bg-danger/10 text-danger border-2 border-line/30 hover:border-danger font-hand font-bold text-xs active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  Revoke Permission
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const granted = await requestHostPermission();
                    setHasCapturePermission(granted);
                  }}
                  className="py-1.5 px-3 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard-sm hover:brightness-105 font-hand font-bold text-xs active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  Allow Saving Images from Any Site
                </button>
              )}
            </div>
          </div>

          {/* Backup & Restore (.zip) */}
          <div data-tour="backup-section" className="flex items-center justify-between pt-3.5 border-t border-line/20">
            <div className="flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-brand-blue" />
              <div>
                <div className="text-sm font-hand font-bold text-ink">Backup & Restore</div>
                <div className="text-xs font-sans text-muted">
                  Export complete .zip archive or restore from file
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="py-1.5 px-3 rounded-sk bg-paper hover:bg-surface text-ink font-hand font-bold text-xs border-2 border-line shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              Manage
            </button>
          </div>

          {/* Storage Health & Diagnostics */}
          <div data-tour="storage-health-section" className="flex items-center justify-between pt-3.5 border-t border-line/20">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-brand-blue" />
              <div>
                <div className="text-sm font-hand font-bold text-ink">Storage Health</div>
                <div className="text-xs font-sans text-muted">
                  Quota analytics, largest items, orphan cleanup & integrity
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsHealthOpen(true)}
              className="py-1.5 px-3 rounded-sk bg-paper hover:bg-surface text-ink font-hand font-bold text-xs border-2 border-line shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>

          {/* Feature Walkthrough Tour */}
          <div data-tour="take-the-tour" className="flex items-center justify-between pt-3.5 border-t border-line/20">
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

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      <StorageHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        onOpenBackup={() => {
          setIsHealthOpen(false);
          setIsBackupOpen(true);
        }}
      />
    </div>
  );
};
