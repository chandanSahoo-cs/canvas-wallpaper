import React, { useEffect } from "react";
import { Paintbrush, Palette } from "lucide-react";
import { FONT_SIZE_MAP } from "../canvas/geometry";
import {
  DRAWING_TOOLS,
  FillStyle,
  FontFamily,
  StrokeStyle,
  TextElement,
} from "../elements/types";
import { cn, isColorLight } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";
import { WallpaperTab } from "./style-panel/WallpaperTab";
import { ElementActions } from "./style-panel/ElementActions";
import { StyleOptions } from "./style-panel/StyleOptions";
import { ImageDetailsSection } from "./style-panel/ImageDetailsSection";
import { ImageElement } from "../elements/types";

export const StylePanel: React.FC = () => {
  const currentTool = useAppStore((s) => s.currentTool);
  const currentFontFamily = useAppStore((s) => s.currentFontFamily);
  const currentStrokeColor = useAppStore((s) => s.currentStrokeColor);
  const currentFillColor = useAppStore((s) => s.currentFillColor);
  const currentStrokeWidth = useAppStore((s) => s.currentStrokeWidth);
  const currentOpacity = useAppStore((s) => s.currentOpacity);
  const currentFillStyle = useAppStore((s) => s.currentFillStyle);
  const currentStrokeStyle = useAppStore((s) => s.currentStrokeStyle);
  const currentRoughness = useAppStore((s) => s.currentRoughness);
  const background = useAppStore((s) => s.background);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const elements = useAppStore((s) => s.elements);
  const activeTab = useAppStore((s) => s.stylePanelTab);
  const setActiveTab = useAppStore((s) => s.setStylePanelTab);

  const setCurrentStyles = useAppStore((s) => s.setCurrentStyles);
  const updateSelectedElements = useAppStore((s) => s.updateSelectedElements);

  const selectedMembers = elements.filter((el) => selectedIds.has(el.id));
  const hasSelection = selectedMembers.length > 0;
  const isLocked = hasSelection && selectedMembers.every((el) => el.locked);

  useEffect(() => {
    if (hasSelection) {
      setActiveTab("styles");
    }
  }, [hasSelection, setActiveTab]);

  useEffect(() => {
    if (DRAWING_TOOLS.has(currentTool)) {
      setActiveTab("styles");
    }
  }, [currentTool, setActiveTab]);

  const isLightBg = isColorLight(background.color || "#f6faf8");

  const handleStrokeChange = (color: string) => {
    setCurrentStyles({ strokeColor: color });
    if (hasSelection) updateSelectedElements({ strokeColor: color });
  };

  const handleFillChange = (color: string) => {
    setCurrentStyles({ fillColor: color });
    if (hasSelection) updateSelectedElements({ fillColor: color });
  };

  const handleFillStyleChange = (style: FillStyle) => {
    setCurrentStyles({ fillStyle: style });
    if (hasSelection) updateSelectedElements({ fillStyle: style });
  };

  const handleStrokeStyleChange = (style: StrokeStyle) => {
    setCurrentStyles({ strokeStyle: style });
    if (hasSelection) updateSelectedElements({ strokeStyle: style });
  };

  const handleRoughnessChange = (roughness: number) => {
    setCurrentStyles({ roughness });
    if (hasSelection) updateSelectedElements({ roughness });
  };

  const handleWidthChange = (width: number) => {
    setCurrentStyles({ strokeWidth: width });
    if (hasSelection) updateSelectedElements({ strokeWidth: width });
  };

  const isTextOnly =
    (hasSelection && selectedMembers.every((m) => m.type === "text")) ||
    (!hasSelection && currentTool === "text");

  const firstSelected = hasSelection ? selectedMembers[0] : null;

  const activeStrokeColor = firstSelected
    ? firstSelected.strokeColor
    : currentStrokeColor;
  const activeFillColor = firstSelected
    ? firstSelected.fillColor
    : currentFillColor;
  const activeStrokeWidth = firstSelected
    ? firstSelected.strokeWidth
    : currentStrokeWidth;
  const activeStrokeStyle = firstSelected
    ? firstSelected.strokeStyle || "solid"
    : currentStrokeStyle;
  const activeFillStyle = firstSelected
    ? firstSelected.fillStyle || "solid"
    : currentFillStyle;
  const activeRoughness = firstSelected
    ? (firstSelected.roughness ?? 1.4)
    : currentRoughness;
  const activeOpacity = firstSelected
    ? (firstSelected.opacity ?? 100)
    : currentOpacity;
  const activeFontFamily =
    firstSelected?.type === "text"
      ? (firstSelected as TextElement).fontFamily || "handwritten"
      : currentFontFamily;
  const activeFontSize =
    firstSelected?.type === "text"
      ? (firstSelected as TextElement).fontSize ||
        FONT_SIZE_MAP[firstSelected.strokeWidth] ||
        20
      : FONT_SIZE_MAP[currentStrokeWidth] || 20;

  const handleFontFamilyChange = (fontFamily: FontFamily) => {
    setCurrentStyles({ fontFamily });
    if (hasSelection) updateSelectedElements({ fontFamily } as any);
  };

  const handleFontSizeChange = (fontSize: number) => {
    const matchingWidth = Object.entries(FONT_SIZE_MAP).find(
      ([, size]) => size === fontSize,
    )?.[0];
    if (matchingWidth) {
      setCurrentStyles({ strokeWidth: Number(matchingWidth) });
    }
    if (hasSelection) updateSelectedElements({ fontSize } as any);
  };

  const handleOpacityChange = (opacity: number) => {
    setCurrentStyles({ opacity });
    if (hasSelection) updateSelectedElements({ opacity });
  };

  return (
    <div
      id="tour-style-panel"
      className="fixed top-20 left-4 z-20 w-64 max-h-[calc(100vh-6rem)] bg-surface text-ink border-2 border-line shadow-hard rounded-sk-lg p-3.5 flex flex-col gap-3.5 text-xs select-none overflow-y-auto overflow-x-hidden"
    >
      {/* Top Tabs: Tool / Element Styles vs Wallpaper Canvas */}
      <div className="flex items-center bg-paper p-1 border-2 border-line rounded-sk gap-1 shrink-0">
        <button
          onClick={() => setActiveTab("styles")}
          className={cn(
            "flex-1 py-1 px-2 rounded-sk-sm font-hand font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "styles"
              ? "bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm"
              : "text-ink/70 hover:text-ink hover:bg-surface/50 border-2 border-transparent",
          )}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>
            {hasSelection
              ? `Selected (${selectedMembers.length})`
              : "Styles"}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("wallpaper")}
          className={cn(
            "flex-1 py-1 px-2 rounded-sk-sm font-hand font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "wallpaper"
              ? "bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm"
              : "text-ink/70 hover:text-ink hover:bg-surface/50 border-2 border-transparent",
          )}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Wallpaper</span>
        </button>
      </div>

      {/* VIEW A: WALLPAPER SETTINGS */}
      {activeTab === "wallpaper" ? (
        <WallpaperTab />
      ) : (
        /* VIEW B: ELEMENT OR DRAWING DEFAULT PROPERTIES */
        <div className="flex flex-col gap-3.5">
          <StyleOptions
            isLightBg={isLightBg}
            isTextOnly={isTextOnly}
            activeStrokeColor={activeStrokeColor}
            activeFillColor={activeFillColor}
            activeStrokeWidth={activeStrokeWidth}
            activeStrokeStyle={activeStrokeStyle}
            activeFillStyle={activeFillStyle}
            activeRoughness={activeRoughness}
            activeOpacity={activeOpacity}
            activeFontFamily={activeFontFamily}
            activeFontSize={activeFontSize}
            onStrokeChange={handleStrokeChange}
            onFillChange={handleFillChange}
            onFontFamilyChange={handleFontFamilyChange}
            onFontSizeChange={handleFontSizeChange}
            onFillStyleChange={handleFillStyleChange}
            onStrokeStyleChange={handleStrokeStyleChange}
            onRoughnessChange={handleRoughnessChange}
            onWidthChange={handleWidthChange}
            onOpacityChange={handleOpacityChange}
          />

          {hasSelection && (
            <ElementActions
              selectedMembers={selectedMembers}
              isLocked={isLocked}
            />
          )}
        </div>
      )}
    </div>
  );
};
