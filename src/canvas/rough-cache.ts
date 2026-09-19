import rough from 'roughjs';
import { CanvasElement, FillStyle, StrokeStyle } from '../elements/types';
import { normBox, diamondPoints } from './geometry';

type RoughGenerator = ReturnType<typeof rough.generator>;
type Drawable = any;

interface CacheEntry {
  key: string;
  drawable: Drawable;
}

const cache = new Map<string, CacheEntry>();
let generator: RoughGenerator | null = null;

function getGenerator(): RoughGenerator {
  if (!generator) {
    generator = rough.generator();
  }
  return generator;
}

function cacheKey(el: CanvasElement): string {
  if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse') {
    return [
      el.type,
      el.x,
      el.y,
      el.width,
      el.height,
      el.strokeColor,
      el.fillColor,
      el.fillStyle || 'solid',
      el.strokeWidth,
      el.strokeStyle || 'solid',
      el.roughness || 1.4,
      el.seed,
    ].join(',');
  }
  return '';
}

export function roughOptions(el: CanvasElement) {
  const strokeLineDash =
    el.strokeStyle === 'dashed'
      ? [el.strokeWidth * 4, el.strokeWidth * 3]
      : el.strokeStyle === 'dotted'
      ? [el.strokeWidth, el.strokeWidth * 2.5]
      : undefined;

  return {
    stroke: el.strokeColor,
    strokeWidth: el.strokeWidth,
    roughness: el.roughness ?? 1.4,
    fill: el.fillColor === 'transparent' ? undefined : el.fillColor,
    fillStyle: el.fillStyle ?? 'solid',
    seed: el.seed,
    strokeLineDash,
  };
}

export function getRoughDrawable(el: CanvasElement): Drawable | null {
  if (el.type !== 'rectangle' && el.type !== 'diamond' && el.type !== 'ellipse') {
    return null;
  }

  const key = cacheKey(el);
  const cached = cache.get(el.id);
  if (cached && cached.key === key) {
    return cached.drawable;
  }

  const gen = getGenerator();
  const opts = roughOptions(el);
  const nb = normBox(el);
  let drawable: Drawable = null;

  if (el.type === 'rectangle') {
    drawable = gen.rectangle(nb.x, nb.y, nb.w, nb.h, opts);
  } else if (el.type === 'diamond') {
    drawable = gen.polygon(diamondPoints(nb.x, nb.y, nb.w, nb.h), opts);
  } else if (el.type === 'ellipse') {
    drawable = gen.ellipse(nb.x + nb.w / 2, nb.y + nb.h / 2, nb.w, nb.h, opts);
  }

  cache.set(el.id, { key, drawable });
  return drawable;
}

export function invalidateCache(id?: string) {
  if (id) cache.delete(id);
  else cache.clear();
}
