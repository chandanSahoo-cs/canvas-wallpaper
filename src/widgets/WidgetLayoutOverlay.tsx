import React, { useState, useRef } from 'react';
import {
  GripHorizontal,
  Check,
  RotateCcw,
  LayoutGrid,
  Plus,
  X,
  Clock,
  Calendar,
  Search,
  Link2,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { useWidgetStore, WidgetPosition, DEFAULT_WIDGET_POSITIONS } from '../store/useWidgetStore';
import { ClockWidget } from './ClockWidget';
import { SearchBar } from './SearchBar';
import { QuickLinks } from './QuickLinks';
import { cn } from '../lib/utils';

interface WidgetLayoutOverlayProps {
  isLight?: boolean;
}

type WidgetKey = 'clock' | 'search' | 'quickLinks';

export const WidgetLayoutOverlay: React.FC<WidgetLayoutOverlayProps> = ({ isLight }) => {
  const isLayoutMode = useWidgetStore((s) => s.isLayoutMode);
  const setIsLayoutMode = useWidgetStore((s) => s.setIsLayoutMode);
  const widgetPositions = useWidgetStore((s) => s.widgetPositions);
  const setWidgetPosition = useWidgetStore((s) => s.setWidgetPosition);
  const resetWidgetPositions = useWidgetStore((s) => s.resetWidgetPositions);

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
  const quickLinks = useWidgetStore((s) => s.quickLinks);
  const addQuickLink = useWidgetStore((s) => s.addQuickLink);
  const removeQuickLink = useWidgetStore((s) => s.removeQuickLink);

  const [activeDrag, setActiveDrag] = useState<WidgetKey | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  if (!isLayoutMode) return null;

  const handlePointerDown = (e: React.PointerEvent, key: WidgetKey) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDrag(key);

    const currentPos = widgetPositions[key];
    const currentPixelX = (currentPos.x / 100) * window.innerWidth;
    const currentPixelY = (currentPos.y / 100) * window.innerHeight;

    dragOffsetRef.current = {
      offsetX: e.clientX - currentPixelX,
      offsetY: e.clientY - currentPixelY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent, key: WidgetKey) => {
    if (activeDrag !== key) return;

    const rawPixelX = e.clientX - dragOffsetRef.current.offsetX;
    const rawPixelY = e.clientY - dragOffsetRef.current.offsetY;

    let targetX = (rawPixelX / window.innerWidth) * 100;
    let targetY = (rawPixelY / window.innerHeight) * 100;

    // Magnetic snap to center (50%) if within 2.5%
    if (Math.abs(targetX - 50) < 2.5) targetX = 50;
    if (Math.abs(targetY - 50) < 2.5) targetY = 50;

    // Magnetic snap to quarter axes (25% and 75%)
    if (Math.abs(targetX - 25) < 2.0) targetX = 25;
    if (Math.abs(targetX - 75) < 2.0) targetX = 75;

    // Clamp coordinates safely within viewport
    const clampedX = Math.min(92, Math.max(8, targetX));
    const clampedY = Math.min(92, Math.max(8, targetY));

    setWidgetPosition(key, { x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
    }
  };

  const handleAddQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    addQuickLink(newTitle, newUrl);
    setNewTitle('');
    setNewUrl('');
  };

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden touch-none"
      onPointerUp={handlePointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          if (isConfigOpen) setIsConfigOpen(false);
          else setIsLayoutMode(false);
        }
      }}
    >
      {/* High-density visual grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '4% 4%',
        }}
      />

      {/* Screen Center Crosshairs */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-indigo-500/30 pointer-events-none" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-indigo-500/30 pointer-events-none" />

      {/* Floating Header Controller Bar */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-neutral-900/95 hover:bg-neutral-900 text-white backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl border border-white/20 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-white/20">
          <LayoutGrid className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold">Widget Alignment</span>
          <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full font-mono">
            Drag Anywhere
          </span>
        </div>

        {/* Toggle Widgets & Add Quick Links Drawer Button */}
        <button
          onClick={() => setIsConfigOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium active:scale-95 transition-all',
            isConfigOpen
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white/10 hover:bg-white/20 text-white'
          )}
          title="Toggle widgets on/off and add quick links"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Widgets & Links</span>
        </button>

        <button
          onClick={resetWidgetPositions}
          title="Reset to default center layout"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => setIsLayoutMode(false)}
          title="Save layout and exit"
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>

      {/* POPUP DRAWER: ADD QUICK LINKS & TOGGLE WIDGETS */}
      {isConfigOpen && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 text-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold">Widgets & Accessories</h3>
            </div>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
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
                      onClick={() => setClockFormat('12h')}
                      className={cn(
                        'px-2 py-0.5 rounded-md font-medium transition-all',
                        clockFormat === '12h' ? 'bg-white text-indigo-600 shadow-xs' : 'text-neutral-600'
                      )}
                    >
                      12h
                    </button>
                    <button
                      onClick={() => setClockFormat('24h')}
                      className={cn(
                        'px-2 py-0.5 rounded-md font-medium transition-all',
                        clockFormat === '24h' ? 'bg-white text-indigo-600 shadow-xs' : 'text-neutral-600'
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
                {showSearch && (
                  <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[10px]">
                    {(['google', 'duckduckgo', 'bing'] as const).map((eng) => (
                      <button
                        key={eng}
                        onClick={() => setSearchEngine(eng)}
                        className={cn(
                          'px-2 py-0.5 rounded-md font-medium transition-all',
                          searchEngine === eng
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        )}
                      >
                        {eng === 'duckduckgo' ? 'DDG' : eng === 'google' ? 'Google' : 'Bing'}
                      </button>
                    ))}
                  </div>
                )}
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
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Manage Quick Links ({quickLinks.length})
            </div>

            {/* Links List */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {quickLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200/80 hover:bg-neutral-100 transition-colors"
                >
                  <span className="font-medium truncate max-w-[260px]">{link.title}</span>
                  <button
                    onClick={() => removeQuickLink(link.id)}
                    className="p-1 rounded-lg hover:bg-rose-100 text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Remove shortcut"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Quick Link Form */}
            <form onSubmit={handleAddQuickLink} className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
              <div className="text-xs font-semibold text-neutral-700">Add New Shortcut</div>
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
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAGGABLE WIDGET 1: CLOCK */}
      {showClock && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'clock')}
          onPointerMove={(e) => handlePointerMove(e, 'clock')}
          style={{
            left: `${widgetPositions.clock.x}%`,
            top: `${widgetPositions.clock.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'absolute cursor-grab active:cursor-grabbing p-4 rounded-3xl border-2 border-dashed transition-shadow flex flex-col items-center group',
            activeDrag === 'clock'
              ? 'border-indigo-500 bg-indigo-500/20 shadow-2xl scale-102 z-40'
              : 'border-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/15 hover:border-indigo-500 z-30'
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tracking-wider uppercase shadow-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3" />
            <span>Clock</span>
            <span className="font-mono opacity-80">
              {Math.round(widgetPositions.clock.x)}%, {Math.round(widgetPositions.clock.y)}%
            </span>
          </div>

          <div className="pointer-events-none">
            <ClockWidget isLight={isLight} />
          </div>
        </div>
      )}

      {/* DRAGGABLE WIDGET 2: SEARCH BAR */}
      {showSearch && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'search')}
          onPointerMove={(e) => handlePointerMove(e, 'search')}
          style={{
            left: `${widgetPositions.search.x}%`,
            top: `${widgetPositions.search.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'absolute cursor-grab active:cursor-grabbing p-3 rounded-3xl border-2 border-dashed transition-shadow flex flex-col items-center group w-full max-w-md',
            activeDrag === 'search'
              ? 'border-indigo-500 bg-indigo-500/20 shadow-2xl scale-102 z-40'
              : 'border-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/15 hover:border-indigo-500 z-30'
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tracking-wider uppercase shadow-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3" />
            <span>Search Bar</span>
            <span className="font-mono opacity-80">
              {Math.round(widgetPositions.search.x)}%, {Math.round(widgetPositions.search.y)}%
            </span>
          </div>

          <div className="w-full pointer-events-none">
            <SearchBar isLight={isLight} />
          </div>
        </div>
      )}

      {/* DRAGGABLE WIDGET 3: QUICK LINKS */}
      {showQuickLinks && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'quickLinks')}
          onPointerMove={(e) => handlePointerMove(e, 'quickLinks')}
          style={{
            left: `${widgetPositions.quickLinks.x}%`,
            top: `${widgetPositions.quickLinks.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'absolute cursor-grab active:cursor-grabbing p-3 rounded-3xl border-2 border-dashed transition-shadow flex flex-col items-center group max-w-xl',
            activeDrag === 'quickLinks'
              ? 'border-indigo-500 bg-indigo-500/20 shadow-2xl scale-102 z-40'
              : 'border-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/15 hover:border-indigo-500 z-30'
          )}
        >
          {/* Drag Handle Label Badge */}
          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tracking-wider uppercase shadow-sm pointer-events-none">
            <GripHorizontal className="w-3 h-3" />
            <span>Quick Links</span>
            <span className="font-mono opacity-80">
              {Math.round(widgetPositions.quickLinks.x)}%, {Math.round(widgetPositions.quickLinks.y)}%
            </span>
          </div>

          <div className="pointer-events-none">
            <QuickLinks isLight={isLight} />
          </div>
        </div>
      )}
    </div>
  );
};
