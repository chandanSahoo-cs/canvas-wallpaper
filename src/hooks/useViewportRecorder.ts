import { useEffect } from "react";

/**
 * Records the current wallpaper page viewport (in CSS pixels) to chrome.storage.local
 * under the key "lastViewport".
 *
 * Requirements:
 * - Uses window.innerWidth / window.innerHeight (CSS pixels, excluding browser chrome).
 * - Debounces resize notifications (~200ms).
 * - Observes document.documentElement via ResizeObserver and window "resize" events.
 * - Wraps all storage calls in try/catch with fallback to localStorage.
 * - Standalone per-install: no sync, no device IDs, no per-device lists.
 */
export function recordWallpaperViewport(): void {
  try {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const viewport = {
      w,
      h,
      dpr,
      t: Date.now(),
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ lastViewport: viewport }, () => {
        if (chrome.runtime.lastError) {
          console.warn("Storage error saving lastViewport:", chrome.runtime.lastError);
        }
      });
    } else {
      localStorage.setItem("lastViewport", JSON.stringify(viewport));
    }
  } catch (err) {
    console.warn("Failed to record lastViewport:", err);
  }
}

export function useViewportRecorder(mode: "wallpaper" | "drawing"): void {
  useEffect(() => {
    // Only the wallpaper page (wallpaper mode) records the real viewport dimensions.
    // If the editor is open in a different sized window or tab, it will not overwrite lastViewport.
    if (mode !== "wallpaper") return;

    // 1. Record immediately on mount
    recordWallpaperViewport();

    // 2. Debounced handler (~200ms) for resize events
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRecord = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        recordWallpaperViewport();
      }, 200);
    };

    // 3. ResizeObserver on document.documentElement
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.documentElement) {
      observer = new ResizeObserver(() => {
        debouncedRecord();
      });
      observer.observe(document.documentElement);
    }

    // 4. Window resize listener (covers F11 fullscreen, zoom Ctrl+/-, bookmarks bar toggle)
    window.addEventListener("resize", debouncedRecord);

    return () => {
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", debouncedRecord);
    };
  }, [mode]);
}
