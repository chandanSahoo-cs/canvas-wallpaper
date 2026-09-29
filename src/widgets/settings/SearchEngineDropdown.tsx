import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useWidgetStore } from "../../store/useWidgetStore";
import { cn } from "../../lib/utils";

const ENGINES = [
  { id: "google", label: "Google" },
  { id: "duckduckgo", label: "DuckDuckGo" },
  { id: "bing", label: "Bing" },
  { id: "brave", label: "Brave Search" },
] as const;

export const SearchEngineDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchEngine = useWidgetStore((s) => s.searchEngine);
  const setSearchEngine = useWidgetStore((s) => s.setSearchEngine);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("pointerdown", handleOutsideClick);
    }
    return () =>
      document.removeEventListener("pointerdown", handleOutsideClick);
  }, [isOpen]);

  const activeLabel =
    ENGINES.find((e) => e.id === searchEngine)?.label || "Google";

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
      >
        <span>{activeLabel}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-neutral-500 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          {ENGINES.map((eng) => (
            <button
              key={eng.id}
              type="button"
              onClick={() => {
                setSearchEngine(eng.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer",
                searchEngine === eng.id
                  ? "bg-indigo-50 text-indigo-600 font-semibold"
                  : "text-neutral-700 hover:bg-neutral-100",
              )}
            >
              <span>{eng.label}</span>
              {searchEngine === eng.id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
