import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Calendar, Search, Link2, Settings, LayoutGrid, Move, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { useWidgetStore } from '../store/useWidgetStore';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);
  const engineDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (engineDropdownRef.current && !engineDropdownRef.current.contains(e.target as Node)) {
        setIsEngineDropdownOpen(false);
      }
    };
    if (isEngineDropdownOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isEngineDropdownOpen]);

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
  const searchEngine = useWidgetStore((s) => s.searchEngine);
  const setSearchEngine = useWidgetStore((s) => s.setSearchEngine);

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
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    clockFormat === '12h'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  12-Hour
                </button>
                <button
                  onClick={() => setClockFormat('24h')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
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
              <div ref={engineDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsEngineDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span>
                    {searchEngine === 'google'
                      ? 'Google'
                      : searchEngine === 'duckduckgo'
                        ? 'DuckDuckGo'
                        : searchEngine === 'bing'
                          ? 'Bing'
                          : 'Brave Search'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-150 ${
                      isEngineDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isEngineDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { id: 'google', label: 'Google' },
                      { id: 'duckduckgo', label: 'DuckDuckGo' },
                      { id: 'bing', label: 'Bing' },
                      { id: 'brave', label: 'Brave Search' },
                    ].map((eng) => (
                      <button
                        key={eng.id}
                        type="button"
                        onClick={() => {
                          setSearchEngine(eng.id as any);
                          setIsEngineDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          searchEngine === eng.id
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span>{eng.label}</span>
                        {searchEngine === eng.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs flex items-center justify-center gap-2 border border-indigo-200/80 active:scale-95 transition-all"
              >
                <Move className="w-3.5 h-3.5" /> Customize Layout (Drag Anywhere)
              </button>
              <button
                onClick={resetWidgetPositions}
                title="Reset widgets to default center stack"
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <a
            href="https://github.com/chandanSahoo-cs/canvas-wallpaper/blob/main/PRIVACY.md"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neutral-400 hover:text-indigo-600 transition-colors"
          >
            Privacy Policy
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
