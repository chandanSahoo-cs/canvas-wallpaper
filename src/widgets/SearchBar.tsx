import React, { useState } from "react";
import { Search } from "lucide-react";
import { useWidgetStore } from "../store/useWidgetStore";
import { useAppStore } from "../store/useAppStore";
import { isColorLight, cn } from "../lib/utils";

interface SearchBarProps {
  isLight?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isLight: propIsLight,
}) => {
  const showSearch = useWidgetStore((s) => s.showSearch);
  const searchEngine = useWidgetStore((s) => s.searchEngine);
  const background = useAppStore((s) => s.background);
  const [query, setQuery] = useState("");

  const isLight =
    propIsLight !== undefined
      ? propIsLight
      : !(background?.type === "image" && background?.imageAssetId) &&
        isColorLight(background?.color || "#f6faf8");

  if (!showSearch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    let url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    if (searchEngine === "duckduckgo") {
      url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    } else if (searchEngine === "bing") {
      url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
    } else if (searchEngine === "brave") {
      url = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
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
          "absolute left-3.5 transition-colors z-10 pointer-events-none",
          isLight ? "text-[#52636A]" : "text-[#96AAB0]",
        )}
      >
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search with ${
          searchEngine === "duckduckgo"
            ? "DuckDuckGo"
            : searchEngine === "bing"
              ? "Bing"
              : searchEngine === "brave"
                ? "Brave"
                : "Google"
        }...`}
        className={cn(
          "w-full pl-10 pr-4 py-2.5 rounded-sk text-xs font-sans outline-none transition-all border-2",
          isLight
            ? "bg-white text-[#0E1A1F] border-[#0E1A1F] shadow-[3px_3px_0_#0E1A1F] placeholder:text-[#52636A] focus-visible:outline-brand-blue"
            : "bg-[#15262D] text-[#EAF4F1] border-[#3D525A] shadow-[3px_3px_0_#000000] placeholder:text-[#96AAB0] focus-visible:outline-brand-blue",
        )}
      />
    </form>
  );
};
