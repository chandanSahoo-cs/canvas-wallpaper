import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useWidgetStore } from '../store/useWidgetStore';
import { useAppStore } from '../store/useAppStore';
import { isColorLight, cn } from '../lib/utils';

export const SearchBar: React.FC = () => {
  const showSearch = useWidgetStore((s) => s.showSearch);
  const searchEngine = useWidgetStore((s) => s.searchEngine);
  const background = useAppStore((s) => s.background);
  const [query, setQuery] = useState('');

  const isLight =
    background.type === 'color' && isColorLight(background.color || '#14141a');

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

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto relative flex items-center group select-none"
    >
      <div
        className={cn(
          'absolute left-3.5 transition-colors',
          isLight
            ? 'text-neutral-500 group-focus-within:text-neutral-900'
            : 'text-white/50 group-focus-within:text-white'
        )}
      >
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search with ${searchEngine === 'duckduckgo' ? 'DuckDuckGo' : searchEngine === 'bing' ? 'Bing' : 'Google'}...`}
        className={cn(
          'w-full pl-10 pr-4 py-2.5 rounded-full backdrop-blur-xl text-sm outline-none transition-all shadow-lg focus:shadow-xl',
          isLight
            ? 'bg-neutral-900/10 hover:bg-neutral-900/15 focus:bg-neutral-900/20 border border-neutral-900/15 focus:border-neutral-900/30 text-neutral-900 placeholder-neutral-500'
            : 'bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/20 focus:border-white/40 text-white placeholder-white/50'
        )}
      />
    </form>
  );
};
