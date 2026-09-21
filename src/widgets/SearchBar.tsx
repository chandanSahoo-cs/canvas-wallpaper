import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useWidgetStore } from '../store/useWidgetStore';

export const SearchBar: React.FC = () => {
  const showSearch = useWidgetStore((s) => s.showSearch);
  const searchEngine = useWidgetStore((s) => s.searchEngine);
  const [query, setQuery] = useState('');

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
      className="w-full max-w-md mx-auto relative flex items-center group"
    >
      <div className="absolute left-3.5 text-white/50 group-focus-within:text-white transition-colors">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search with ${searchEngine === 'duckduckgo' ? 'DuckDuckGo' : searchEngine === 'bing' ? 'Bing' : 'Google'}...`}
        className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/15 hover:bg-white/20 focus:bg-white/25 backdrop-blur-md border border-white/20 focus:border-white/40 text-white placeholder-white/50 text-sm outline-none transition-all shadow-lg focus:shadow-xl"
      />
    </form>
  );
};
