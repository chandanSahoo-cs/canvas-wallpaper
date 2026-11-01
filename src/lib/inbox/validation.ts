import { MAX_TEXT_LENGTH, MAX_TITLE_LENGTH, MAX_URL_LENGTH } from "./types";

/**
 * Validates that a URL is strictly http: or https: and within size limits.
 * Rejects javascript:, data:, file:, vbscript:, etc.
 */
export function validateHttpUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;

  // Block dangerous schemes
  if (/^(javascript|data|file|vbscript|about|chrome|chrome-extension):/i.test(trimmed)) {
    return null;
  }

  let formatted = trimmed;
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }

  try {
    const parsed = new URL(formatted);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Strips HTML tags and treats input strictly as plain text.
 * Caps length and trims whitespace.
 */
export function sanitizePlainText(raw?: string | null, maxLength = MAX_TEXT_LENGTH): string {
  if (!raw || typeof raw !== "string") return "";

  // Strip HTML tags using regex
  const stripped = raw.replace(/<[^>]*>?/gm, "");
  // Strip control characters except newline and tab
  const cleaned = stripped.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  const trimmed = cleaned.trim();
  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

/**
 * Sanitizes page/item titles to single-line plain text within MAX_TITLE_LENGTH.
 */
export function sanitizeTitle(raw?: string | null, maxLength = MAX_TITLE_LENGTH): string {
  if (!raw || typeof raw !== "string") return "Untitled";
  const plain = sanitizePlainText(raw, maxLength);
  // Collapse whitespace/newlines into single spaces
  const singleLine = plain.replace(/\s+/g, " ").trim();
  return singleLine || "Untitled";
}

/**
 * Checks whether Content-Type is a supported non-SVG image.
 */
export function isImageContentTypeAllowed(contentType?: string | null): boolean {
  if (!contentType || typeof contentType !== "string") return false;
  const clean = contentType.split(";")[0].trim().toLowerCase();

  // Reject SVG specifically as mandated by requirements
  if (clean === "image/svg+xml" || clean.includes("svg")) {
    return false;
  }

  return clean.startsWith("image/");
}

/**
 * Sliding window burst rate limiter to protect against rapid loops or spam.
 */
export class BurstRateLimiter {
  private timestamps: number[] = [];
  private maxTokens: number;
  private windowMs: number;

  constructor(maxTokens = 10, windowMs = 5000) {
    this.maxTokens = maxTokens;
    this.windowMs = windowMs;
  }

  public allow(now = Date.now()): boolean {
    // Evict timestamps older than window
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length < this.maxTokens) {
      this.timestamps.push(now);
      return true;
    }

    return false;
  }

  public reset(): void {
    this.timestamps = [];
  }
}
