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

export function isColorLight(colorStr?: string): boolean {
  if (!colorStr) return false;
  const s = colorStr.toLowerCase().trim();
  if (['white', 'snow', 'ivory', 'ghostwhite', 'floralwhite', 'whitesmoke', 'aliceblue', 'seashell'].includes(s)) {
    return true;
  }
  if (['black', 'transparent', 'none'].includes(s)) {
    return false;
  }

  let hex = s.replace('#', '').trim();
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.slice(0, 3).split('').map((c) => c + c).join('');
  } else if (hex.length >= 6) {
    hex = hex.substring(0, 6);
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

  const match = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
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

export function sanitizeWebUrl(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(javascript|data|file|vbscript|about):/i.test(trimmed)) {
    return '';
  }
  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return '';
  }
  return '';
}

export function escapeXml(str?: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
