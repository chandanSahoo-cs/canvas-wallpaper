import React, { useState, useEffect } from 'react';
import { useWidgetStore } from '../store/useWidgetStore';

export const ClockWidget: React.FC = () => {
  const showClock = useWidgetStore((s) => s.showClock);
  const showDate = useWidgetStore((s) => s.showDate);
  const clockFormat = useWidgetStore((s) => s.clockFormat);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!showClock && !showDate) return null;

  let hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  let period = '';

  if (clockFormat === '12h') {
    period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  }
  const formattedHours = clockFormat === '24h' ? hours.toString().padStart(2, '0') : hours.toString();

  const formattedDate = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-center justify-center select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
      {showClock && (
        <div className="flex items-baseline gap-2">
          <span className="text-6xl md:text-7xl font-bold tracking-tight text-white font-mono">
            {formattedHours}:{minutes}
          </span>
          {clockFormat === '12h' && (
            <span className="text-xl font-medium text-white/80 uppercase">
              {period}
            </span>
          )}
        </div>
      )}
      {showDate && (
        <div className="text-base font-medium text-white/90 tracking-wide mt-1">
          {formattedDate}
        </div>
      )}
    </div>
  );
};
