import React, { useRef, useState, useEffect, useMemo } from "react";
import { LibraryItem } from "../../lib/library/types";
import { LibraryItemCard } from "./LibraryItemCard";

interface VirtualizedGridProps {
  items: LibraryItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectRange: (targetId: string) => void;
  onLocate: (sceneId: string, elementId?: string) => void;
  onTagClick?: (tag: string) => void;
}

const ITEM_WIDTH = 175;
const ITEM_HEIGHT = 195;
const GAP = 14;
const PADDING = 16;
const OVERSCAN_ROWS = 2;

export const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onSelectRange,
  onLocate,
  onTagClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setDimensions({
        width: el.clientWidth || 800,
        height: el.clientHeight || 600,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const { cols, totalRows, totalHeight, visibleItems } = useMemo(() => {
    const availableWidth = Math.max(ITEM_WIDTH, dimensions.width - PADDING * 2);
    const cols = Math.max(
      1,
      Math.floor((availableWidth + GAP) / (ITEM_WIDTH + GAP)),
    );
    const totalRows = Math.ceil(items.length / cols);
    const totalHeight = totalRows * (ITEM_HEIGHT + GAP) + PADDING * 2;

    const rowHeight = ITEM_HEIGHT + GAP;
    const startRow = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS,
    );
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + dimensions.height) / rowHeight) + OVERSCAN_ROWS,
    );

    const visibleItems: {
      item: LibraryItem;
      index: number;
      top: number;
      left: number;
    }[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index >= items.length) break;
        const left = PADDING + col * (ITEM_WIDTH + GAP);
        const top = PADDING + row * (ITEM_HEIGHT + GAP);
        visibleItems.push({
          item: items[index],
          index,
          top,
          left,
        });
      }
    }

    return { cols, totalRows, totalHeight, visibleItems };
  }, [items, dimensions, scrollTop]);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted select-none">
        <p className="font-hand font-bold text-base text-ink mb-1">
          No items found
        </p>
        <p className="text-xs font-sans max-w-sm">
          No assets or notes match the current filters. Try resetting your search or filter tags.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden relative select-none"
    >
      <div
        style={{ height: `${totalHeight}px`, position: "relative", width: "100%" }}
      >
        {visibleItems.map(({ item, index, top, left }) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              top: `${top}px`,
              left: `${left}px`,
              width: `${ITEM_WIDTH}px`,
              height: `${ITEM_HEIGHT}px`,
            }}
          >
            <LibraryItemCard
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={(shiftKey) => {
                if (shiftKey) {
                  onSelectRange(item.id);
                } else {
                  onToggleSelect(item.id);
                }
              }}
              onLocate={onLocate}
              onTagClick={onTagClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
