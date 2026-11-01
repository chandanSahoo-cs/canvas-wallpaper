import React, { useState, useEffect } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Filter,
  Layers,
  Palette,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { LibraryFilters, LibrarySortBy } from "../../lib/library/types";
import { Scene } from "../../store/useSceneStore";
import { cn } from "../../lib/utils";

const PRESET_COLOR_SWATCHES = [
  { name: "Brand Blue", hex: "#46BAEB" },
  { name: "Brand Green", hex: "#00BF63" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Coral", hex: "#E03131" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Dark Ink", hex: "#14141A" },
  { name: "Light Paper", hex: "#F5F5F7" },
];

interface LibraryToolbarProps {
  filters: LibraryFilters;
  sortBy: LibrarySortBy;
  scenes: Scene[];
  availableTags: string[];
  totalItemCount: number;
  filteredItemCount: number;
  onFilterChange: <K extends keyof LibraryFilters>(
    key: K,
    val: LibraryFilters[K],
  ) => void;
  onClearFilter: (key: keyof LibraryFilters) => void;
  onResetFilters: () => void;
  onSortChange: (sort: LibrarySortBy) => void;
  onOpenTagManager?: () => void;
}

export const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
  filters,
  sortBy,
  scenes,
  availableTags,
  totalItemCount,
  filteredItemCount,
  onFilterChange,
  onClearFilter,
  onResetFilters,
  onSortChange,
  onOpenTagManager,
}) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [customHexInput, setCustomHexInput] = useState(filters.colorHex || "");

  useEffect(() => {
    if (filters.colorHex) {
      setCustomHexInput(filters.colorHex);
    }
  }, [filters.colorHex]);
  const hasActiveFilters =
    Boolean(filters.query) ||
    Boolean(filters.tag) ||
    Boolean(filters.boardId) ||
    (filters.type && filters.type !== "all") ||
    Boolean(filters.colorHex) ||
    (filters.dateRange && filters.dateRange !== "all") ||
    Boolean(filters.unplacedOnly) ||
    Boolean(filters.duplicatesOnly);

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface border-b-2 border-line shrink-0 select-none">
      {/* Top Bar: Search + Primary Filters + Sort */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.query || ""}
            placeholder="Search tags, notes, captions, text, boards..."
            onChange={(e) => onFilterChange("query", e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs font-sans rounded-sk bg-paper text-ink border-2 border-line/30 focus:border-brand-blue focus:outline-none"
          />
          {filters.query && (
            <button
              onClick={() => onFilterChange("query", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Type Segmented Buttons */}
          <div className="flex items-center bg-paper p-0.5 rounded-sk border border-line/30 text-xs font-hand">
            {(["all", "image", "text"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onFilterChange("type", t)}
                className={cn(
                  "px-2.5 py-1 rounded-sk-sm font-bold capitalize transition-all cursor-pointer",
                  (filters.type || "all") === t
                    ? "bg-brand-blue text-on-accent border border-line shadow-hard-sm"
                    : "text-ink/70 hover:text-ink hover:bg-surface/50 border border-transparent",
                )}
              >
                {t === "all" ? "All" : t === "image" ? "Images" : "Notes"}
              </button>
            ))}
          </div>

          {/* Board Selector */}
          <select
            value={filters.boardId || ""}
            onChange={(e) => onFilterChange("boardId", e.target.value || undefined)}
            className="px-2 py-1.5 text-xs font-hand font-bold rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line focus:outline-none cursor-pointer"
          >
            <option value="">All Boards</option>
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                Board: {s.name}
              </option>
            ))}
          </select>

          {/* Tag Selector */}
          {availableTags.length > 0 && (
            <select
              value={filters.tag || ""}
              onChange={(e) => onFilterChange("tag", e.target.value || undefined)}
              className="px-2 py-1.5 text-xs font-hand font-bold rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line focus:outline-none cursor-pointer"
            >
              <option value="">All Tags</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}

          {/* Manage Tags Button */}
          {onOpenTagManager && (
            <button
              type="button"
              title="Manage tags, colors, and merging"
              onClick={onOpenTagManager}
              className="px-2 py-1.5 text-xs font-hand font-bold rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface cursor-pointer flex items-center gap-1"
            >
              <Tag className="w-3.5 h-3.5 text-brand-blue" />
              <span>Tags...</span>
            </button>
          )}

          {/* Color Filter Popover */}
          <div className="relative">
            <button
              type="button"
              title="Filter by OKLab color distance"
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className={cn(
                "px-2 py-1.5 text-xs font-hand font-bold rounded-sk border-2 transition-all cursor-pointer flex items-center gap-1.5",
                filters.colorHex
                  ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
                  : "bg-paper text-ink border-line/30 hover:border-line hover:bg-surface",
              )}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Color</span>
              {filters.colorHex && (
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white shrink-0"
                  style={{ backgroundColor: filters.colorHex }}
                />
              )}
            </button>

            {isColorPickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-surface text-ink border-2 border-line rounded-sk shadow-hard p-3 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-line/20">
                  <span className="font-hand font-bold text-xs">Filter by OKLab Color</span>
                  <button
                    onClick={() => setIsColorPickerOpen(false)}
                    className="text-muted hover:text-ink cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preset Swatches */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      title={swatch.name}
                      onClick={() => {
                        onFilterChange("colorHex", swatch.hex);
                        setCustomHexInput(swatch.hex);
                      }}
                      className="w-6 h-6 rounded-sk-sm border border-line/40 transition-transform hover:scale-110 cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: swatch.hex,
                        outline:
                          filters.colorHex?.toUpperCase() === swatch.hex.toUpperCase()
                            ? "2px solid var(--ink)"
                            : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Custom Hex Input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customHexInput}
                    placeholder="#46BAEB"
                    onChange={(e) => setCustomHexInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = customHexInput.trim();
                        if (/^#?[0-9a-fA-F]{3,6}$/.test(val)) {
                          const formatted = val.startsWith("#") ? val : "#" + val;
                          onFilterChange("colorHex", formatted);
                        }
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs font-mono rounded-sk-sm bg-paper text-ink border border-line/30 focus:border-brand-blue focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customHexInput.trim();
                      if (/^#?[0-9a-fA-F]{3,6}$/.test(val)) {
                        const formatted = val.startsWith("#") ? val : "#" + val;
                        onFilterChange("colorHex", formatted);
                      }
                    }}
                    className="px-2 py-1 text-xs font-hand font-bold rounded-sk-sm bg-paper hover:bg-surface border border-line/40 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                {/* Tolerance Slider */}
                <div className="flex flex-col gap-1 pt-1.5 border-t border-line/20">
                  <div className="flex items-center justify-between text-[11px] font-sans text-muted">
                    <span>Tolerance (OKLab distance)</span>
                    <span className="font-mono font-bold text-ink">
                      {(filters.colorTolerance ?? 0.18).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.40"
                    step="0.01"
                    value={filters.colorTolerance ?? 0.18}
                    onChange={(e) =>
                      onFilterChange("colorTolerance", parseFloat(e.target.value))
                    }
                    className="w-full cursor-pointer accent-brand-blue"
                  />
                  <div className="flex justify-between text-[9px] text-muted font-sans">
                    <span>Exact (0.05)</span>
                    <span>Broad (0.40)</span>
                  </div>
                </div>

                {/* Clear Color Filter */}
                {filters.colorHex && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearFilter("colorHex");
                      setIsColorPickerOpen(false);
                    }}
                    className="mt-1 py-1 text-xs font-hand font-bold text-danger hover:underline cursor-pointer text-center"
                  >
                    Clear Color Filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as LibrarySortBy)}
            className="px-2 py-1.5 text-xs font-hand font-bold rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line focus:outline-none cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="size">Sort: File Size</option>
            <option value="hue">Sort: Dominant Hue</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Pills + Active Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
        {/* Toggle: Not on any board */}
        <button
          onClick={() =>
            onFilterChange("unplacedOnly", !filters.unplacedOnly || undefined)
          }
          className={cn(
            "px-2 py-0.5 rounded-sk border font-hand font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px]",
            filters.unplacedOnly
              ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
              : "bg-paper text-ink/70 border-line/30 hover:border-line hover:text-ink",
          )}
        >
          <span>Unplaced Only</span>
        </button>

        {/* Toggle: Duplicates */}
        <button
          onClick={() =>
            onFilterChange("duplicatesOnly", !filters.duplicatesOnly || undefined)
          }
          className={cn(
            "px-2 py-0.5 rounded-sk border font-hand font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px]",
            filters.duplicatesOnly
              ? "bg-warning text-white border-line shadow-hard-sm"
              : "bg-paper text-ink/70 border-line/30 hover:border-line hover:text-ink",
          )}
        >
          <Copy className="w-3 h-3" />
          <span>Duplicates</span>
        </button>

        {/* Date Filter selector */}
        <select
          value={filters.dateRange || "all"}
          onChange={(e) =>
            onFilterChange("dateRange", e.target.value as any)
          }
          className="px-2 py-0.5 text-[11px] font-hand font-bold rounded-sk bg-paper text-ink border border-line/30 hover:border-line cursor-pointer"
        >
          <option value="all">Any Date</option>
          <option value="today">Today</option>
          <option value="week">Past 7 Days</option>
          <option value="month">Past 30 Days</option>
        </select>

        {/* Active Filter Chips */}
        {filters.tag && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sk bg-brand-blue/15 text-blue-text border border-brand-blue font-hand text-[11px]">
            <span>#{filters.tag}</span>
            <button
              onClick={() => onClearFilter("tag")}
              className="hover:text-danger cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {filters.boardId && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sk bg-brand-blue/15 text-blue-text border border-brand-blue font-hand text-[11px]">
            <span>
              Board: {scenes.find((s) => s.id === filters.boardId)?.name || "Selected"}
            </span>
            <button
              onClick={() => onClearFilter("boardId")}
              className="hover:text-danger cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {filters.colorHex && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sk bg-paper border border-line font-hand text-[11px]">
            <span
              className="w-3 h-3 rounded-full border border-line shrink-0"
              style={{ backgroundColor: filters.colorHex }}
            />
            <span className="font-mono text-[10px]">{filters.colorHex}</span>
            <span className="text-[9px] font-sans text-muted">
              (±{(filters.colorTolerance ?? 0.18).toFixed(2)})
            </span>
            <button
              onClick={() => onClearFilter("colorHex")}
              className="hover:text-danger cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-[11px] font-hand text-danger hover:underline cursor-pointer ml-auto"
          >
            Reset Filters
          </button>
        )}

        <div className="text-[11px] font-mono text-muted ml-auto">
          {filteredItemCount === totalItemCount
            ? `${totalItemCount} items`
            : `${filteredItemCount} of ${totalItemCount} items`}
        </div>
      </div>
    </div>
  );
};
