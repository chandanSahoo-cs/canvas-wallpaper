import { hasHostPermission } from "../permissions";
import { ALLOWED_IMAGE_MIME_TYPES, ingestImage } from "../assets";
import { FETCH_TIMEOUT_MS, MAX_IMAGE_FETCH_BYTES } from "./types";
import { isImageContentTypeAllowed, validateHttpUrl, readBodyWithCap } from "./validation";
import { LinkElement } from "../../elements/types";
import { useAppStore } from "../../store/useAppStore";

export interface OgMetadataResult {
  title?: string;
  previewAssetId?: string;
  faviconAssetId?: string;
}

const MAX_HTML_SAMPLE_BYTES = 512 * 1024; // 512 KB cap for reading <head>

/**
 * Best-effort OpenGraph and favicon metadata resolver running in the new tab page.
 * Strictly local, respects runtime host permissions, enforces 15s timeout, 25MB cap,
 * and rejects SVG/non-images.
 */
export async function resolveOpenGraphMetadata(
  url: string,
): Promise<OgMetadataResult | null> {
  if (!validateHttpUrl(url)) return null;

  const hasPerm = await hasHostPermission();
  if (!hasPerm) return null;

  try {
    const res = await fetch(url, {
      credentials: "omit",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return null;
    }

    // Read initial HTML text (up to 512 KB is plenty for <head>)
    const reader = res.body?.getReader();
    let htmlText = "";
    if (reader) {
      const decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
      let bytesRead = 0;
      while (bytesRead < MAX_HTML_SAMPLE_BYTES) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        bytesRead += value.byteLength;
        htmlText += decoder.decode(value, { stream: true });
        // Stop early if </head> has closed
        if (htmlText.includes("</head>") || htmlText.includes("<body")) break;
      }
      reader.cancel();
    } else {
      const fullText = await res.text();
      htmlText = fullText.slice(0, MAX_HTML_SAMPLE_BYTES);
    }

    if (!htmlText) return null;

    if (typeof DOMParser === "undefined") return null;
    const doc = new DOMParser().parseFromString(htmlText, "text/html");

    // 1. Extract title
    const ogTitle =
      doc.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ||
      doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content")?.trim() ||
      doc.querySelector("title")?.textContent?.trim() ||
      undefined;

    // 2. Extract og:image
    const rawOgImage =
      doc.querySelector('meta[property="og:image"]')?.getAttribute("content")?.trim() ||
      doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content")?.trim() ||
      undefined;

    let previewAssetId: string | undefined;
    if (rawOgImage) {
      try {
        const resolvedImageUrl = new URL(rawOgImage, url).href;
        if (validateHttpUrl(resolvedImageUrl)) {
          const imgRes = await fetch(resolvedImageUrl, {
            credentials: "omit",
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          });

          if (imgRes.ok) {
            const imgContentType = imgRes.headers.get("content-type") || "";
            if (isImageContentTypeAllowed(imgContentType)) {
              const blob = await readBodyWithCap(imgRes, MAX_IMAGE_FETCH_BYTES);
              if (
                blob &&
                ALLOWED_IMAGE_MIME_TYPES.has(blob.type) &&
                blob.size <= MAX_IMAGE_FETCH_BYTES
              ) {
                const asset = await ingestImage(blob, {
                  url: resolvedImageUrl,
                  title: ogTitle || "Link Preview",
                });
                previewAssetId = asset.id;
              }
            }
          }
        }
      } catch (err) {
        console.debug("Failed to ingest og:image:", err);
      }
    }

    // 3. Extract favicon
    const rawFavicon =
      doc.querySelector('link[rel~="icon"]')?.getAttribute("href")?.trim() ||
      doc.querySelector('link[rel~="shortcut"]')?.getAttribute("href")?.trim() ||
      "/favicon.ico";

    let faviconAssetId: string | undefined;
    if (rawFavicon) {
      try {
        const resolvedFavUrl = new URL(rawFavicon, url).href;
        if (validateHttpUrl(resolvedFavUrl)) {
          const favRes = await fetch(resolvedFavUrl, {
            credentials: "omit",
            signal: AbortSignal.timeout(8_000),
          });

          if (favRes.ok) {
            const favContentType = favRes.headers.get("content-type") || "";
            if (isImageContentTypeAllowed(favContentType)) {
              const blob = await readBodyWithCap(favRes, 512 * 1024);
              if (blob && ALLOWED_IMAGE_MIME_TYPES.has(blob.type) && blob.size <= 512 * 1024) {
                const asset = await ingestImage(blob, {
                  url: resolvedFavUrl,
                  title: "Favicon",
                });
                faviconAssetId = asset.id;
              }
            }
          }
        }
      } catch (err) {
        console.debug("Failed to ingest favicon:", err);
      }
    }

    return {
      title: ogTitle,
      previewAssetId,
      faviconAssetId,
    };
  } catch (err) {
    console.debug("OpenGraph resolution skipped:", err);
    return null;
  }
}

/**
 * Asynchronously enriches a newly placed LinkElement on the canvas with
 * OpenGraph title, preview image, and favicon.
 */
export async function enrichLinkElementOnBoard(elementId: string): Promise<void> {
  const state = useAppStore.getState();
  const el = state.elements.find((e) => e.id === elementId) as LinkElement | undefined;
  if (!el || el.type !== "link" || !el.url) return;

  const result = await resolveOpenGraphMetadata(el.url);
  if (!result) return;

  const updates: Partial<LinkElement> = {};
  if (result.title && result.title !== el.domain) {
    updates.title = result.title;
  }
  if (result.previewAssetId) {
    updates.previewAssetId = result.previewAssetId;
    // Expand card height to accommodate preview image banner
    updates.height = Math.max(el.height, 160);
  }
  if (result.faviconAssetId) {
    updates.faviconAssetId = result.faviconAssetId;
  }

  if (Object.keys(updates).length > 0) {
    const nextElements = useAppStore.getState().elements.map((e) =>
      e.id === elementId ? ({ ...e, ...updates } as LinkElement) : e,
    );
    useAppStore.getState().setElements(nextElements);
    useAppStore.getState().saveToStorage();
  }
}
