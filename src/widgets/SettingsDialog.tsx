import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Search, Link2, LayoutGrid, Move, RotateCcw } from 'lucide-react';
import { useWidgetStore } from '../store/useWidgetStore';
import { PrivacyPolicyDialog } from '../components/PrivacyPolicyDialog';
import { SearchEngineDropdown } from './settings/SearchEngineDropdown';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);
  const resetWidgetPositions = useWidgetStore((s) => s.resetWidgetPositions);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 text-neutral-800 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon/48.png"
              alt=""
              aria-hidden="true"
              className="w-5 h-5 object-contain"
            />
            <h2 id="settings-dialog-title" className="text-base font-semibold">New Tab Widgets</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 py-4">
          {/* Clock Settings */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-neutral-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Digital Clock</div>
                <div className="text-xs text-neutral-500">Show time on wallpaper</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showClock}
                onChange={(e) => setShowClock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {showClock && (
            <div className="ml-7 flex items-center gap-3">
              <span className="text-xs text-neutral-500 font-medium">Format:</span>
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setClockFormat('12h')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    clockFormat === '12h'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  12-Hour
                </button>
                <button
                  onClick={() => setClockFormat('24h')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    clockFormat === '24h'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  24-Hour
                </button>
              </div>
            </div>
          )}

          {/* Date & Day Settings */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-neutral-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Date & Day</div>
                <div className="text-xs text-neutral-500">Show day and date below clock</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDate}
                onChange={(e) => setShowDate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Search Settings */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-neutral-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Search Bar</div>
                <div className="text-xs text-neutral-500">Quick search overlay</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showSearch}
                onChange={(e) => setShowSearch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {showSearch && (
            <div className="ml-7 flex items-center gap-3">
              <span className="text-xs text-neutral-500 font-medium">Engine:</span>
              <SearchEngineDropdown />
            </div>
          )}

          {/* Quick Links Settings */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Link2 className="w-4 h-4 text-neutral-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Quick Links</div>
                <div className="text-xs text-neutral-500">Shortcut bookmark tiles</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showQuickLinks}
                onChange={(e) => setShowQuickLinks(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Widget Layout & Alignment */}
          <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-sm font-medium">Widget Layout</div>
                  <div className="text-xs text-neutral-500">Align accessories anywhere on full screen</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => {
                  onClose();
                  setIsLayoutMode(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs flex items-center justify-center gap-2 border border-indigo-200/80 active:scale-95 transition-all cursor-pointer"
              >
                <Move className="w-3.5 h-3.5" /> Customize Layout (Drag Anywhere)
              </button>
              <button
                onClick={resetWidgetPositions}
                title="Reset widgets to default center stack"
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-xs text-neutral-400 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium active:scale-95 transition-all shadow-sm cursor-pointer"
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
