import React, { useMemo, useState, useEffect } from "react";
import { BackgroundConfig } from "../elements/types";
import { isColorLight } from "../lib/utils";
import { getAssetObjectUrl } from "../lib/assets";

const PATTERN_OVERLAYS: Record<string, { image: string; size: string }> = {
  dots: {
    image: "radial-gradient(rgba(255,255,255,0.15) 1.2px, transparent 1.2px)",
    size: "24px 24px",
  },
  grid: {
    image:
      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    size: "24px 24px, 24px 24px",
  },
  lines: {
    image: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
    size: "100% 28px",
  },
};

export function useWallpaperBackground(background: BackgroundConfig) {
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (background.type === "image" && background.imageAssetId) {
      getAssetObjectUrl(background.imageAssetId).then((url) => {
        if (!cancelled) setBgImageUrl(url);
      });
    } else {
      setBgImageUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [background.type, background.imageAssetId]);

  const effectiveBgColor = useMemo(() => {
    if (background.color) return background.color.toLowerCase();
    if (typeof document !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      return theme === "dark" ? "#0e1a1f" : "#f6faf8";
    }
    return "#f6faf8";
  }, [background.color]);

  const isLight = useMemo(() => {
    if (background.type === "image" && (background.imageAssetId || bgImageUrl)) {
      return false;
    }
    return isColorLight(effectiveBgColor);
  }, [effectiveBgColor, background.type, background.imageAssetId, bgImageUrl]);

  const pattern = useMemo(() => {
    if (!background.pattern || background.pattern === "none") return null;
    const base = PATTERN_OVERLAYS[background.pattern];
    if (!base) return null;
    if (isLight) {
      if (background.pattern === "dots") {
        return {
          image: "radial-gradient(rgba(14,26,31,0.15) 1.2px, transparent 1.2px)",
          size: "24px 24px",
        };
      }
      if (background.pattern === "grid") {
        return {
          image:
            "linear-gradient(rgba(14,26,31,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(14,26,31,0.08) 1px, transparent 1px)",
          size: "24px 24px, 24px 24px",
        };
      }
      if (background.pattern === "lines") {
        return {
          image: "linear-gradient(rgba(14,26,31,0.08) 1px, transparent 1px)",
          size: "100% 28px",
        };
      }
    }
    return base;
  }, [background.pattern, isLight]);

  const baseBg = bgImageUrl ? `url(${bgImageUrl})` : undefined;

  const imageFit = background.fit || "cover";

  const bgStyle: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: effectiveBgColor,
      backgroundImage: pattern
        ? baseBg
          ? `${pattern.image}, ${baseBg}`
          : pattern.image
        : baseBg,
      backgroundSize: pattern
        ? baseBg
          ? `${pattern.size}, ${imageFit}`
          : pattern.size
        : imageFit,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }, [
    effectiveBgColor,
    pattern,
    baseBg,
    imageFit,
  ]);

  return { bgStyle, isLight };
}
