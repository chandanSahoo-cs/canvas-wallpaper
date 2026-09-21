import React from 'react';
import { X, Clock, Calendar, Search, Link2, Settings } from 'lucide-react';
import { useWidgetStore } from '../store/useWidgetStore';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 text-neutral-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold">New Tab Widgets</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
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
              <select
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value as any)}
                className="bg-neutral-100 text-neutral-700 text-xs py-1 px-2.5 rounded-lg outline-none cursor-pointer border border-neutral-200"
              >
                <option value="google">Google</option>
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="bing">Bing</option>
              </select>
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
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium active:scale-95 transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
