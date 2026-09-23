import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { useWidgetStore } from '../store/useWidgetStore';
import { useAppStore } from '../store/useAppStore';
import { isColorLight, cn } from '../lib/utils';

interface SearchBarProps {
  isLight?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isLight: propIsLight }) => {
  const showSearch = useWidgetStore((s) => s.showSearch);
  const searchEngine = useWidgetStore((s) => s.searchEngine);
  const setSearchEngine = useWidgetStore((s) => s.setSearchEngine);
  const background = useAppStore((s) => s.background);
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLight =
    propIsLight !== undefined
      ? propIsLight
      : !(background?.type === 'image' && background?.imageUrl) &&
        isColorLight(background?.color || '#14141a');

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isDropdownOpen]);

  if (!showSearch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    let url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    if (searchEngine === 'duckduckgo') {
      url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    } else if (searchEngine === 'bing') {
      url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
    }

    window.location.href = url;
  };

  const engines = [
    { id: 'google', label: 'Google' },
    { id: 'duckduckgo', label: 'DuckDuckGo' },
    { id: 'bing', label: 'Bing' },
  ] as const;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto relative flex items-center group select-none"
    >
      <div ref={dropdownRef} className="absolute left-2 z-20 flex items-center">
        <button
          type="button"
          onClick={() => setIsDropdownOpen((v) => !v)}
          title={`Search engine: ${searchEngine === 'duckduckgo' ? 'DuckDuckGo' : searchEngine === 'bing' ? 'Bing' : 'Google'}. Click to switch.`}
          className={cn(
            'flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-full transition-colors active:scale-95 cursor-pointer',
            isLight
              ? 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <Search className="w-4 h-4 shrink-0" />
          <ChevronDown className={cn("w-3 h-3 opacity-60 transition-transform duration-150", isDropdownOpen && "rotate-180")} />
        </button>

        {isDropdownOpen && (
          <div
            className={cn(
              'absolute top-full left-0 mt-2 py-1.5 px-1 rounded-2xl shadow-xl backdrop-blur-xl border text-xs font-medium z-50 min-w-[135px] animate-in fade-in zoom-in-95 duration-150',
              isLight
                ? 'bg-white/95 text-neutral-800 border-neutral-200 shadow-black/15'
                : 'bg-neutral-900/90 text-white border-white/15 shadow-black/40'
            )}
          >
            {engines.map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => {
                  setSearchEngine(eng.id);
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-left cursor-pointer',
                  searchEngine === eng.id
                    ? isLight
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'bg-indigo-600/30 text-indigo-300 font-semibold'
                    : isLight
                      ? 'hover:bg-neutral-100 text-neutral-700'
                      : 'hover:bg-white/10 text-white/80'
                )}
              >
                <span>{eng.label}</span>
                {searchEngine === eng.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search with ${searchEngine === 'duckduckgo' ? 'DuckDuckGo' : searchEngine === 'bing' ? 'Bing' : 'Google'}...`}
        className={cn(
          'w-full pl-14 pr-4 py-2.5 rounded-full backdrop-blur-xl text-sm outline-none transition-all shadow-lg focus:shadow-xl',
          isLight
            ? 'bg-white/80 hover:bg-white/95 focus:bg-white border border-neutral-300 focus:border-indigo-500 text-neutral-900 placeholder-neutral-500 shadow-black/10'
            : 'bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/20 focus:border-white/40 text-white placeholder-white/50'
        )}
      />
    </form>
  );
};
