import { defineBackground } from "wxt/utils/define-background";
import { ingestImage } from "../src/lib/assets";
import {
  addInboxItem,
  BurstRateLimiter,
  FETCH_TIMEOUT_MS,
  isImageContentTypeAllowed,
  MAX_IMAGE_FETCH_BYTES,
  sanitizePlainText,
  sanitizeTitle,
  setInboxCaptureHint,
  updateBadgeCount,
  validateHttpUrl,
} from "../src/lib/inbox";

export default defineBackground(() => {
  const rateLimiter = new BurstRateLimiter(10, 5000);

  // 1. Maintain Action Click (Opens a new tab)
  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({});
  });

  // 2. Register Context Menus on install/update (MV3 Requirement)
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "papertab-save-image",
        title: "Save image to PaperTab",
        contexts: ["image"],
      });

      chrome.contextMenus.create({
        id: "papertab-save-link",
        title: "Save link to PaperTab",
        contexts: ["link"],
      });

      chrome.contextMenus.create({
        id: "papertab-save-selection",
        title: "Save selection to PaperTab",
        contexts: ["selection"],
      });

      chrome.contextMenus.create({
        id: "papertab-save-page",
        title: "Save page to PaperTab",
        contexts: ["page"],
      });
    });

    // Initialize badge count on startup
    updateBadgeCount().catch(() => {});
  });

  // 3. Handle Context Menu Actions
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // Burst rate limiter guard
    if (!rateLimiter.allow()) {
      console.warn("PaperTab capture ignored: rate limit exceeded");
      return;
    }

    const pageUrl = validateHttpUrl(tab?.url || info.pageUrl) || undefined;
    const pageTitle = sanitizeTitle(tab?.title);
    const source = {
      url: pageUrl,
      title: pageTitle,
      savedAt: Date.now(),
    };

    try {
      switch (info.menuItemId) {
        case "papertab-save-image": {
          const srcUrl = info.srcUrl;
          if (!srcUrl) return;

          let imageSaved = false;

          // Attempt to fetch the image with credentials omitted, 15s timeout, 25MB cap
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

            const res = await fetch(srcUrl, {
              credentials: "omit",
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const contentType = res.headers.get("content-type");
              const contentLength = res.headers.get("content-length");

              // Content-type check: image/* only, strictly reject svg
              if (isImageContentTypeAllowed(contentType)) {
                // Size cap check
                if (!contentLength || parseInt(contentLength, 10) <= MAX_IMAGE_FETCH_BYTES) {
                  const blob = await res.blob();
                  if (blob.size <= MAX_IMAGE_FETCH_BYTES && isImageContentTypeAllowed(blob.type)) {
                    const asset = await ingestImage(blob, source);
                    await addInboxItem({
                      kind: "image",
                      assetId: asset.id,
                      source,
                    });
                    imageSaved = true;
                  }
                }
              }
            }
          } catch (fetchErr) {
            console.warn("Direct image fetch blocked or failed:", fetchErr);
          }

          // If direct image fetch was blocked (CORS / host permissions / network):
          // Save a fallback link item so the user NEVER loses what they clicked
          if (!imageSaved) {
            const fallbackUrl = validateHttpUrl(srcUrl) || pageUrl;
            await addInboxItem({
              kind: "link",
              url: fallbackUrl,
              title: sanitizeTitle(`Image from ${pageTitle || "web"}`),
              faviconUrl: validateHttpUrl(tab?.favIconUrl) || undefined,
              fallbackReason: "cors_blocked",
              source,
            });
            // Flag a one-time hint to inform user about optional permissions or drag & drop
            await setInboxCaptureHint(true);
          }
          break;
        }

        case "papertab-save-selection": {
          const text = sanitizePlainText(info.selectionText);
          if (!text) return;

          await addInboxItem({
            kind: "text",
            text,
            source,
          });
          break;
        }

        case "papertab-save-link": {
          const linkUrl = validateHttpUrl(info.linkUrl);
          if (!linkUrl) return;

          await addInboxItem({
            kind: "link",
            url: linkUrl,
            title: sanitizeTitle(info.selectionText || linkUrl),
            faviconUrl: validateHttpUrl(tab?.favIconUrl) || undefined,
            source,
          });
          break;
        }

        case "papertab-save-page": {
          if (!pageUrl) return;

          await addInboxItem({
            kind: "link",
            url: pageUrl,
            title: pageTitle || "Saved Page",
            faviconUrl: validateHttpUrl(tab?.favIconUrl) || undefined,
            source,
          });
          break;
        }
      }
    } catch (err) {
      console.error("Context menu capture error:", err);
    }
  });
});
