import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

/**
 * Subscribes the editor to the wallpaper page's recorded viewport (`lastViewport`)
 * from chrome.storage.local and storage.onChanged so the boundary marker updates live.
 *
 * Fallback: If no value exists in storage yet, falls back to the editor window's own innerWidth/innerHeight.
 */
export function useViewportBoundary(): void {
  const setViewportBoundary = useAppStore((s) => s.setViewportBoundary);
  const setShowBoundaryMarker = useAppStore((s) => s.setShowBoundaryMarker);

  useEffect(() => {
    // 1. Initial read from chrome.storage.local (with localStorage fallback)
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.get(
          ["lastViewport", "showBoundaryMarker"],
          (result: Record<string, any>) => {
            if (
              result?.lastViewport &&
              typeof result.lastViewport.w === "number" &&
              typeof result.lastViewport.h === "number"
            ) {
              setViewportBoundary({
                w: result.lastViewport.w,
                h: result.lastViewport.h,
              });
            } else {
              setViewportBoundary({
                w: window.innerWidth,
                h: window.innerHeight,
              });
            }

            if (result?.showBoundaryMarker !== undefined) {
              setShowBoundaryMarker(Boolean(result.showBoundaryMarker));
            }
          },
        );
      } else {
        const rawVp = localStorage.getItem("lastViewport");
        if (rawVp) {
          try {
            const parsed = JSON.parse(rawVp);
            if (parsed && typeof parsed.w === "number" && typeof parsed.h === "number") {
              setViewportBoundary({ w: parsed.w, h: parsed.h });
            }
          } catch {}
        } else {
          setViewportBoundary({
            w: window.innerWidth,
            h: window.innerHeight,
          });
        }

        const rawShow = localStorage.getItem("showBoundaryMarker");
        if (rawShow !== null) {
          setShowBoundaryMarker(rawShow === "true");
        }
      }
    } catch (err) {
      console.warn("Storage error loading viewport boundary:", err);
      setViewportBoundary({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    }

    // 2. Subscribe to chrome.storage.onChanged for live updates across tabs/windows
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "local") {
        if (changes.lastViewport?.newValue) {
          const val = changes.lastViewport.newValue as
            | { w?: unknown; h?: unknown }
            | undefined;
          if (
            val &&
            typeof val.w === "number" &&
            typeof val.h === "number"
          ) {
            setViewportBoundary({ w: val.w, h: val.h });
          }
        }

        if (changes.showBoundaryMarker !== undefined) {
          setShowBoundaryMarker(Boolean(changes.showBoundaryMarker.newValue));
        }
      }
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged &&
      typeof chrome.storage.onChanged.addListener === "function"
    ) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // Fallback storage event listener for cross-tab updates without chrome extension API
    const handleWindowStorage = (e: StorageEvent) => {
      if (e.key === "lastViewport" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed.w === "number" && typeof parsed.h === "number") {
            setViewportBoundary({ w: parsed.w, h: parsed.h });
          }
        } catch {}
      }
      if (e.key === "showBoundaryMarker" && e.newValue !== null) {
        setShowBoundaryMarker(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleWindowStorage);

    return () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.onChanged &&
        typeof chrome.storage.onChanged.removeListener === "function"
      ) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
      window.removeEventListener("storage", handleWindowStorage);
    };
  }, [setViewportBoundary, setShowBoundaryMarker]);
}
