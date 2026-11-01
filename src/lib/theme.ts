export type ThemeMode = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "papertab_theme";

export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {}
  return "system";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;

  let effective: "light" | "dark";
  if (mode === "system") {
    const isDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    effective = isDark ? "dark" : "light";
  } else {
    effective = mode;
  }

  document.documentElement.setAttribute("data-theme", effective);
}

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [THEME_STORAGE_KEY]: mode });
    }
  } catch {}
  applyTheme(mode);
}

export function initTheme() {
  const current = getStoredTheme();
  applyTheme(current);

  if (typeof window !== "undefined" && window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (getStoredTheme() === "system") {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handler);
  }

  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get([THEME_STORAGE_KEY], (res) => {
      const stored = res?.[THEME_STORAGE_KEY] as ThemeMode | undefined;
      if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
        applyTheme(stored);
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[THEME_STORAGE_KEY]) {
        const next = changes[THEME_STORAGE_KEY].newValue as ThemeMode;
        if (next && (next === "light" || next === "dark" || next === "system")) {
          applyTheme(next);
        }
      }
    });
  }
}

// Execute immediately upon module import (before React mount)
initTheme();
