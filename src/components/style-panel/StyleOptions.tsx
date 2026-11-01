import React from "react";
import { FillStyle, FontFamily, StrokeStyle } from "../../elements/types";
import { ColorPickers } from "./ColorPickers";
import { TypographySection } from "./TypographySection";
import { StrokeAndFillStyles } from "./StrokeAndFillStyles";

interface StyleOptionsProps {
  isLightBg: boolean;
  isTextOnly: boolean;
  activeStrokeColor: string;
  activeFillColor: string;
  activeStrokeWidth: number;
  activeStrokeStyle: StrokeStyle;
  activeFillStyle: FillStyle;
  activeRoughness: number;
  activeOpacity: number;
  activeFontFamily: FontFamily;
  activeFontSize: number;
  onStrokeChange: (color: string) => void;
  onFillChange: (color: string) => void;
  onFontFamilyChange: (font: FontFamily) => void;
  onFontSizeChange: (size: number) => void;
  onFillStyleChange: (style: FillStyle) => void;
  onStrokeStyleChange: (style: StrokeStyle) => void;
  onRoughnessChange: (roughness: number) => void;
  onWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
}

export const StyleOptions: React.FC<StyleOptionsProps> = ({
  isLightBg,
  isTextOnly,
  activeStrokeColor,
  activeFillColor,
  activeStrokeWidth,
  activeStrokeStyle,
  activeFillStyle,
  activeRoughness,
  activeOpacity,
  activeFontFamily,
  activeFontSize,
  onStrokeChange,
  onFillChange,
  onFontFamilyChange,
  onFontSizeChange,
  onFillStyleChange,
  onStrokeStyleChange,
  onRoughnessChange,
  onWidthChange,
  onOpacityChange,
}) => {
  return (
    <>
      <ColorPickers
        isLightBg={isLightBg}
        activeStrokeColor={activeStrokeColor}
        activeFillColor={activeFillColor}
        onStrokeChange={onStrokeChange}
        onFillChange={onFillChange}
      />

      {isTextOnly ? (
        <TypographySection
          activeFontFamily={activeFontFamily}
          activeFontSize={activeFontSize}
          onFontFamilyChange={onFontFamilyChange}
          onFontSizeChange={onFontSizeChange}
        />
      ) : (
        <StrokeAndFillStyles
          activeFillStyle={activeFillStyle}
          activeStrokeStyle={activeStrokeStyle}
          activeRoughness={activeRoughness}
          activeStrokeWidth={activeStrokeWidth}
          onFillStyleChange={onFillStyleChange}
          onStrokeStyleChange={onStrokeStyleChange}
          onRoughnessChange={onRoughnessChange}
          onWidthChange={onWidthChange}
        />
      )}

      {/* Opacity */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-hand font-bold text-muted">Opacity</span>
          <span className="text-xs font-mono font-medium text-ink/80">{activeOpacity}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={activeOpacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="w-full h-1.5 bg-paper border border-line/40 rounded-sk appearance-none cursor-pointer accent-brand-blue"
        />
      </div>
    </>
  );
};
