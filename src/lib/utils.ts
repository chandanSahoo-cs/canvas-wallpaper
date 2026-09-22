import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(): string {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function isColorLight(colorStr: string): boolean {
  if (!colorStr) return false;
  let hex = colorStr.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return lum > 0.5;
    }
  }
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.5;
  }
  return false;
}

export function getDefaultStrokeColor(bgColor?: string): string {
  return isColorLight(bgColor || '#14141a') ? '#1e1e1e' : '#ffffff';
}
