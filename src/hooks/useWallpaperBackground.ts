import React, { useMemo } from 'react';
import { BackgroundConfig } from '../elements/types';
import { isColorLight } from '../lib/utils';

export const PATTERN_OVERLAYS: Record<string, { image: string; size: string }> = {
  dots: {
    image: 'radial-gradient(rgba(255,255,255,0.15) 1.2px, transparent 1.2px)',
    size: '24px 24px',
  },
  grid: {
    image:
      'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
    size: '24px 24px, 24px 24px',
  },
  lines: {
    image: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
    size: '100% 28px',
  },
};

export function useWallpaperBackground(background: BackgroundConfig) {
  const pattern =
    background.pattern && background.pattern !== 'none'
      ? PATTERN_OVERLAYS[background.pattern]
      : null;

  const baseBg =
    background.type === 'image' && background.imageUrl
      ? `url(${background.imageUrl})`
      : undefined;

  const bgStyle: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: background.color || '#14141a',
      backgroundImage: pattern
        ? baseBg
          ? `${pattern.image}, ${baseBg}`
          : pattern.image
        : baseBg,
      backgroundSize: pattern
        ? baseBg
          ? `${pattern.size}, cover`
          : pattern.size
        : 'cover',
      backgroundPosition: 'center',
    };
  }, [background.color, background.pattern, background.type, background.imageUrl, pattern, baseBg]);

  const isLight = useMemo(() => {
    if (background.type === 'image' && background.imageUrl) {
      return false;
    }
    return isColorLight(background.color || '#14141a');
  }, [background.color, background.type, background.imageUrl]);

  return { bgStyle, isLight };
}
