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
        className="flex items-center gap-1.5 px-2.5 py-1 bg-paper hover:bg-surface border-2 border-line text-ink rounded-sk text-xs font-hand font-bold shadow-hard-sm transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
      >
        <span>{activeLabel}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-40 bg-surface text-ink border-2 border-line rounded-sk-lg shadow-hard py-1 z-50 animate-in fade-in duration-100">
          {ENGINES.map((eng) => (
            <button
              key={eng.id}
              type="button"
              onClick={() => {
                setSearchEngine(eng.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 text-xs font-hand text-left transition-colors cursor-pointer hover:bg-paper",
                searchEngine === eng.id
                  ? "font-bold text-blue-text bg-paper"
                  : "text-ink/80",
              )}
            >
              <span>{eng.label}</span>
              {searchEngine === eng.id && <Check className="w-3.5 h-3.5 text-blue-text" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
