import React, { useEffect, useState } from "react";
import { useWidgetStore } from "../store/useWidgetStore";
import { ClockWidget } from "../widgets/ClockWidget";
import { SearchBar } from "../widgets/SearchBar";
import { QuickLinks } from "../widgets/QuickLinks";

interface WallpaperWidgetsProps {
  isLight: boolean;
}

export const WallpaperWidgets: React.FC<WallpaperWidgetsProps> = ({
  isLight,
}) => {
  const widgetPositions = useWidgetStore((s) => s.widgetPositions);
  const showClock = useWidgetStore((s) => s.showClock);
  const showSearch = useWidgetStore((s) => s.showSearch);
  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);

  const [isNarrowScreen, setIsNarrowScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {isNarrowScreen ? (
        /* Narrow Viewport Fallback: Centered Stack */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-8">
          <div className="pointer-events-auto flex flex-col items-center gap-6 w-full max-w-xl">
            <ClockWidget isLight={isLight} />
            <SearchBar isLight={isLight} />
            <QuickLinks isLight={isLight} />
          </div>
        </div>
      ) : (
        /* Full-Screen Free-Form Spatial Positioning */
        <>
          {showClock && (
            <div
              className="absolute pointer-events-auto transition-transform"
              style={{
                left: `${widgetPositions.clock.x}%`,
                top: `${widgetPositions.clock.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <ClockWidget isLight={isLight} />
            </div>
          )}

          {showSearch && (
            <div
              className="absolute pointer-events-auto w-full max-w-md transition-transform px-4"
              style={{
                left: `${widgetPositions.search.x}%`,
                top: `${widgetPositions.search.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <SearchBar isLight={isLight} />
            </div>
          )}

          {showQuickLinks && (
            <div
              className="absolute pointer-events-auto max-w-xl transition-transform px-4"
              style={{
                left: `${widgetPositions.quickLinks.x}%`,
                top: `${widgetPositions.quickLinks.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <QuickLinks isLight={isLight} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
