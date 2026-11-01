/**
 * OKLab color space transformations and perceptual color quantization.
 * Based on Björn Ottosson's OKLab model (2020).
 */

export interface OklabColor {
  L: number;
  a: number;
  b: number;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

import { PaletteColor } from "./types";
export type { PaletteColor };

// Convert sRGB channel [0, 255] to linear sRGB [0, 1]
function sRgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

// Convert linear sRGB channel [0, 1] to sRGB [0, 255]
function linearToSRgb(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  const srgb =
    clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, srgb * 255)));
}

/**
 * Convert standard sRGB [0, 255] to OKLab.
 */
export function rgbToOklab(r: number, g: number, b: number): OklabColor {
  const lr = sRgbToLinear(r);
  const lg = sRgbToLinear(g);
  const lb = sRgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/**
 * Convert OKLab to standard sRGB [0, 255].
 */
export function oklabToRgb(L: number, a: number, b: number): RgbColor {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: linearToSRgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSRgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSRgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/**
 * Format RGB numbers to 6-char hex string #RRGGBB in uppercase.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parse hex color string to RGB.
 */
export function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Perceptual color distance in OKLab.
 * Values typically range from 0 (identical) to ~0.4+ (distinct colors).
 */
export function oklabDistance(c1: OklabColor, c2: OklabColor): number {
  const dL = c1.L - c2.L;
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Perceptual distance between two hex colors in OKLab space.
 */
export function hexDistanceOklab(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1.0;
  const ok1 = rgbToOklab(rgb1.r, rgb1.g, rgb1.b);
  const ok2 = rgbToOklab(rgb2.r, rgb2.g, rgb2.b);
  return oklabDistance(ok1, ok2);
}

interface PixelSample {
  r: number;
  g: number;
  b: number;
  L: number;
  a: number;
  b_ok: number;
}

/**
 * Deterministic Median-Cut Quantization in OKLab color space.
 * Downsamples image data, filters out transparent pixels,
 * and extracts up to `maxColors` representative palette swatches.
 */
export function extractPaletteFromImageData(
  data: Uint8ClampedArray,
  maxColors: number = 5,
): PaletteColor[] {
  const pixels: PixelSample[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    // Skip near-transparent pixels
    if (alpha < 128) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const ok = rgbToOklab(r, g, b);

    pixels.push({
      r,
      g,
      b,
      L: ok.L,
      a: ok.a,
      b_ok: ok.b,
    });
  }

  if (pixels.length === 0) {
    return [{ hex: "#FFFFFF", weight: 1.0 }];
  }

  // Median-cut algorithm in OKLab
  let buckets: PixelSample[][] = [pixels];

  while (buckets.length < maxColors) {
    let bestBucketIdx = -1;
    let maxRange = -1;
    let bestAxis: "L" | "a" | "b_ok" = "L";

    for (let idx = 0; idx < buckets.length; idx++) {
      const b = buckets[idx];
      if (b.length < 2) continue;

      let minL = Infinity,
        maxL = -Infinity;
      let minA = Infinity,
        maxA = -Infinity;
      let minB = Infinity,
        maxB = -Infinity;

      for (const p of b) {
        if (p.L < minL) minL = p.L;
        if (p.L > maxL) maxL = p.L;
        if (p.a < minA) minA = p.a;
        if (p.a > maxA) maxA = p.a;
        if (p.b_ok < minB) minB = p.b_ok;
        if (p.b_ok > maxB) maxB = p.b_ok;
      }

      const rangeL = maxL - minL;
      const rangeA = maxA - minA;
      const rangeB = maxB - minB;
      const largestRange = Math.max(rangeL, rangeA, rangeB);

      if (largestRange > maxRange) {
        maxRange = largestRange;
        bestBucketIdx = idx;
        bestAxis =
          largestRange === rangeL
            ? "L"
            : largestRange === rangeA
              ? "a"
              : "b_ok";
      }
    }

    if (bestBucketIdx === -1 || maxRange < 0.005) {
      break; // No further meaningful splits
    }

    const bucketToSplit = buckets[bestBucketIdx];
    // Sort deterministically along the highest-variance axis
    bucketToSplit.sort((p1, p2) => {
      const diff = p1[bestAxis] - p2[bestAxis];
      if (Math.abs(diff) > 0.0001) return diff;
      return p1.L - p2.L || p1.r - p2.r || p1.g - p2.g || p1.b - p2.b;
    });

    const mid = Math.floor(bucketToSplit.length / 2);
    const left = bucketToSplit.slice(0, mid);
    const right = bucketToSplit.slice(mid);

    buckets.splice(bestBucketIdx, 1, left, right);
  }

  const total = pixels.length;
  const palette: PaletteColor[] = buckets
    .filter((b) => b.length > 0)
    .map((b) => {
      let sumL = 0,
        sumA = 0,
        sumB = 0;
      for (const p of b) {
        sumL += p.L;
        sumA += p.a;
        sumB += p.b_ok;
      }
      const meanOk = {
        L: sumL / b.length,
        a: sumA / b.length,
        b: sumB / b.length,
      };
      const rgb = oklabToRgb(meanOk.L, meanOk.a, meanOk.b);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const weight = Math.round((b.length / total) * 1000) / 1000;
      return { hex, weight };
    });

  // Sort deterministically: highest weight first, then hex string
  palette.sort((a, b) => {
    const diff = b.weight - a.weight;
    if (Math.abs(diff) > 0.001) return diff;
    return a.hex.localeCompare(b.hex);
  });

  return palette.slice(0, maxColors);
}

/**
 * Merges palettes from multiple images into 5-8 dominant swatches.
 * Clusters perceptually close colors in OKLab space, weighting them by source weights.
 */
export function mergePalettes(
  palettes: PaletteColor[][],
  targetCount: number = 6,
): PaletteColor[] {
  const allColors: { ok: OklabColor; hex: string; weight: number }[] = [];

  for (const pal of palettes) {
    if (!Array.isArray(pal)) continue;
    for (const c of pal) {
      if (!c || !c.hex) continue;
      const rgb = hexToRgb(c.hex);
      if (!rgb) continue;
      const ok = rgbToOklab(rgb.r, rgb.g, rgb.b);
      allColors.push({
        ok,
        hex: rgbToHex(rgb.r, rgb.g, rgb.b),
        weight: c.weight || 1,
      });
    }
  }

  if (allColors.length === 0) {
    return [
      { hex: "#46BAEB", weight: 0.5 },
      { hex: "#00BF63", weight: 0.5 },
    ];
  }

  interface Cluster {
    L: number;
    a: number;
    b: number;
    weight: number;
  }

  let clusters: Cluster[] = allColors.map((c) => ({
    L: c.ok.L,
    a: c.ok.a,
    b: c.ok.b,
    weight: c.weight,
  }));

  const maxClust = Math.max(5, Math.min(8, targetCount));

  while (clusters.length > maxClust) {
    let closestDist = Infinity;
    let idx1 = -1;
    let idx2 = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dL = clusters[i].L - clusters[j].L;
        const da = clusters[i].a - clusters[j].a;
        const db = clusters[i].b - clusters[j].b;
        const dist = Math.sqrt(dL * dL + da * da + db * db);
        if (dist < closestDist) {
          closestDist = dist;
          idx1 = i;
          idx2 = j;
        }
      }
    }

    if (idx1 === -1 || idx2 === -1) break;

    const c1 = clusters[idx1];
    const c2 = clusters[idx2];
    const totalW = c1.weight + c2.weight;

    const merged: Cluster = {
      L: (c1.L * c1.weight + c2.L * c2.weight) / totalW,
      a: (c1.a * c1.weight + c2.a * c2.weight) / totalW,
      b: (c1.b * c1.weight + c2.b * c2.weight) / totalW,
      weight: totalW,
    };

    clusters.splice(idx2, 1);
    clusters.splice(idx1, 1, merged);
  }

  const sumWeights = clusters.reduce((acc, c) => acc + c.weight, 0) || 1;

  const result: PaletteColor[] = clusters.map((c) => {
    const rgb = oklabToRgb(c.L, c.a, c.b);
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      weight: Math.round((c.weight / sumWeights) * 1000) / 1000,
    };
  });

  result.sort((a, b) => {
    const diff = b.weight - a.weight;
    if (Math.abs(diff) > 0.001) return diff;
    return a.hex.localeCompare(b.hex);
  });

  return result.slice(0, maxClust);
}
