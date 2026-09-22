import React, { useState, useEffect } from 'react';
import { useWidgetStore } from '../store/useWidgetStore';
import { useAppStore } from '../store/useAppStore';
import { isColorLight, cn } from '../lib/utils';

interface ClockWidgetProps {
  isLight?: boolean;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ isLight: propIsLight }) => {
  const showClock = useWidgetStore((s) => s.showClock);
  const showDate = useWidgetStore((s) => s.showDate);
  const clockFormat = useWidgetStore((s) => s.clockFormat);
  const background = useAppStore((s) => s.background);

  const [time, setTime] = useState(new Date());

  const isLight =
    propIsLight !== undefined
      ? propIsLight
      : !(background?.type === 'image' && background?.imageUrl) &&
        isColorLight(background?.color || '#14141a');

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
    <div
      className={cn(
        'flex flex-col items-center justify-center select-none transition-colors duration-300',
        isLight
          ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]'
          : 'drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
      )}
    >
      {showClock && (
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-6xl md:text-7xl font-bold tracking-tight font-mono transition-colors',
              isLight ? 'text-neutral-900' : 'text-white'
            )}
          >
            {formattedHours}:{minutes}
          </span>
          {clockFormat === '12h' && (
            <span
              className={cn(
                'text-xl font-semibold uppercase transition-colors',
                isLight ? 'text-neutral-700' : 'text-white/80'
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
            'text-base font-semibold tracking-wide mt-1 transition-colors',
            isLight ? 'text-neutral-800' : 'text-white/90'
          )}
        >
          {formattedDate}
        </div>
      )}
    </div>
  );
};
