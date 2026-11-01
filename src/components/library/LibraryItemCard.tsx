import React, { useState, useEffect } from "react";
import { Check, ExternalLink, MapPin, Tag, Type } from "lucide-react";
import { LibraryItem } from "../../lib/library/types";
import { cn } from "../../lib/utils";

interface LibraryItemCardProps {
  item: LibraryItem;
  isSelected: boolean;
  onToggleSelect: (shiftKey: boolean) => void;
  onLocate: (sceneId: string, elementId?: string) => void;
  onTagClick?: (tag: string) => void;
}

export const LibraryItemCard: React.FC<LibraryItemCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onLocate,
  onTagClick,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [showLocateMenu, setShowLocateMenu] = useState(false);

  useEffect(() => {
    if (item.type !== "image" || !item.thumbBlob) return;
    const url = URL.createObjectURL(item.thumbBlob);
    setThumbUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item.thumbBlob, item.type]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent toggle if clicking links or locate menu
    if ((e.target as HTMLElement).closest(".prevent-card-select")) return;
    onToggleSelect(e.shiftKey);
  };

  const placementCount = item.placements.length;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative w-full h-full flex flex-col bg-surface border-2 rounded-sk transition-all duration-150 cursor-pointer overflow-hidden",
        isSelected
          ? "border-brand-blue shadow-hard bg-brand-blue/5"
          : "border-line shadow-hard-sm hover:border-line hover:shadow-hard hover:-translate-y-0.5",
      )}
    >
      {/* Top Header / Checkbox overlay */}
      <div className="absolute top-1.5 left-1.5 z-10">
        <button
          type="button"
          aria-label="Select item"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(e.shiftKey);
          }}
          className={cn(
            "w-5 h-5 rounded-sk-sm border-2 flex items-center justify-center transition-all cursor-pointer",
            isSelected
              ? "bg-brand-blue text-on-accent border-line"
              : "bg-surface/90 border-line/50 opacity-0 group-hover:opacity-100 hover:border-line",
          )}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>
      </div>

      {/* Locate button (if placed on any board) */}
      {placementCount > 0 && (
        <div className="absolute top-1.5 right-1.5 z-10 prevent-card-select">
          <button
            type="button"
            title={`Used on ${placementCount} board${placementCount > 1 ? "s" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (placementCount === 1) {
                onLocate(item.placements[0].sceneId, item.placements[0].elementId);
              } else {
                setShowLocateMenu((v) => !v);
              }
            }}
            className="px-1.5 py-0.5 rounded-sk-sm bg-surface/90 text-ink border border-line shadow-sm font-hand font-bold text-[10px] flex items-center gap-1 hover:bg-paper cursor-pointer"
          >
            <MapPin className="w-3 h-3 text-brand-green" />
            <span>{placementCount}</span>
          </button>

          {showLocateMenu && (
            <div className="absolute right-0 top-6 bg-surface text-ink border-2 border-line rounded-sk shadow-hard p-1 flex flex-col gap-1 w-44 z-30 animate-in fade-in duration-100">
              <div className="px-2 py-0.5 text-[9px] font-hand font-bold text-muted uppercase border-b border-line/20">
                Boards with item
              </div>
              {item.placements.map((p, idx) => (
                <button
                  key={`${p.sceneId}-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocateMenu(false);
                    onLocate(p.sceneId, p.elementId);
                  }}
                  className="px-2 py-1 text-left text-[11px] font-hand rounded-sk-sm hover:bg-paper text-ink flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{p.sceneName}</span>
                  <span className="text-[9px] text-muted ml-1 shrink-0">
                    {p.caption || "View"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thumbnail area */}
      <div className="w-full h-28 bg-paper flex items-center justify-center overflow-hidden border-b border-line/20 relative">
        {item.type === "image" ? (
          thumbUrl ? (
            <img
              src={thumbUrl}
              alt={item.title}
              className="w-full h-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted font-hand text-xs">
              Loading...
            </div>
          )
        ) : (
          <div className="w-full h-full p-2.5 flex flex-col justify-start bg-amber-500/5">
            <div className="flex items-center gap-1 text-[10px] font-hand font-bold text-muted mb-1">
              <Type className="w-3 h-3 text-brand-blue" />
              <span>Text Element</span>
            </div>
            <p className="font-hand text-[11px] text-ink line-clamp-3 leading-snug">
              {item.textContent || "Untitled Note"}
            </p>
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-2 flex-1 flex flex-col justify-between gap-1 text-left">
        <div>
          <h4
            title={item.title}
            className="font-hand font-bold text-xs text-ink truncate leading-tight"
          >
            {item.title}
          </h4>
          <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono mt-0.5">
            {item.type === "image" && item.width && item.height ? (
              <span>
                {item.width}x{item.height}
              </span>
            ) : null}
            {item.bytes ? (
              <span>• {(item.bytes / 1024).toFixed(0)} KB</span>
            ) : null}
          </div>
        </div>

        {/* Tags or Palette */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-line/10">
          {/* Palette dots */}
          {item.palette && item.palette.length > 0 ? (
            <div className="flex items-center gap-1">
              {item.palette.slice(0, 4).map((pal, idx) => (
                <span
                  key={idx}
                  title={pal.hex}
                  className="w-2.5 h-2.5 rounded-full border border-line/40 inline-block shrink-0"
                  style={{ backgroundColor: pal.hex }}
                />
              ))}
            </div>
          ) : (
            <div />
          )}

          {/* Tag count or first tag */}
          {item.tags.length > 0 ? (
            <div className="flex items-center gap-0.5 overflow-hidden prevent-card-select">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(item.tags[0]);
                }}
                className="px-1 py-0.2 rounded-sk-sm bg-brand-blue/15 text-blue-text font-hand text-[9px] truncate max-w-[70px] hover:bg-brand-blue/25"
              >
                #{item.tags[0]}
              </span>
              {item.tags.length > 1 && (
                <span className="text-[9px] font-hand text-muted">
                  +{item.tags.length - 1}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
