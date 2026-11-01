import React, { useState, useEffect } from "react";
import { useWidgetStore } from "../store/useWidgetStore";
import { useAppStore } from "../store/useAppStore";
import { isColorLight, cn } from "../lib/utils";

interface ClockWidgetProps {
  isLight?: boolean;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  isLight: propIsLight,
}) => {
  const showClock = useWidgetStore((s) => s.showClock);
  const showDate = useWidgetStore((s) => s.showDate);
  const clockFormat = useWidgetStore((s) => s.clockFormat);
  const background = useAppStore((s) => s.background);

  const [time, setTime] = useState(new Date());

  const isLight =
    propIsLight !== undefined
      ? propIsLight
      : !(background?.type === "image" && background?.imageUrl) &&
        isColorLight(background?.color || "#14141a");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!showClock && !showDate) return null;

  let hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, "0");
  let period = "";

  if (clockFormat === "12h") {
    period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
  }
  const formattedHours =
    clockFormat === "24h"
      ? hours.toString().padStart(2, "0")
      : hours.toString();

  const formattedDate = time.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col items-center justify-center select-none transition-colors duration-150">
      {showClock && (
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-6xl md:text-7xl font-hand font-bold tracking-tight transition-colors",
              isLight
                ? "text-[#0E1A1F] [text-shadow:2px_2px_0_rgba(255,255,255,0.7)]"
                : "text-[#EAF4F1] [text-shadow:2px_2px_0_#000000]",
            )}
          >
            {formattedHours}:{minutes}
          </span>
          {clockFormat === "12h" && (
            <span
              className={cn(
                "text-xl font-hand font-bold uppercase transition-colors",
                isLight
                  ? "text-[#52636A] [text-shadow:1px_1px_0_rgba(255,255,255,0.7)]"
                  : "text-[#96AAB0] [text-shadow:1px_1px_0_#000000]",
              )}
            >
              {period}
            </span>
          )}
        </div>
      )}
      {showDate && (
        <div
          className={cn(
            "text-base md:text-lg font-hand font-bold tracking-wide mt-1 transition-colors",
            isLight
              ? "text-[#0E1A1F] [text-shadow:1px_1px_0_rgba(255,255,255,0.7)]"
              : "text-[#EAF4F1] [text-shadow:1px_1px_0_#000000]",
          )}
        >
          {formattedDate}
        </div>
      )}
    </div>
  );
};
