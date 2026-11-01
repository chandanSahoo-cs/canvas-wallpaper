export interface CanvasOverlayTheme {
  blue: string;
  green: string;
  ink: string;
  surface: string;
  paper: string;
  line: string;
  muted: string;
  danger: string;
  warning: string;
  onAccent: string;
}

let cachedTheme: CanvasOverlayTheme | null = null;
let lastThemeAttr = "";

export function getCanvasOverlayTheme(): CanvasOverlayTheme {
  if (typeof document === "undefined") {
    return {
      blue: "#46BAEB",
      green: "#00BF63",
      ink: "#0E1A1F",
      surface: "#FFFFFF",
      paper: "#F6FAF8",
      line: "#0E1A1F",
      muted: "#52636A",
      danger: "#D92D20",
      warning: "#B54708",
      onAccent: "#0E1A1F",
    };
  }

  const currentThemeAttr = document.documentElement.getAttribute("data-theme") || "";
  if (cachedTheme && currentThemeAttr === lastThemeAttr) {
    return cachedTheme;
  }

  const style = getComputedStyle(document.documentElement);
  const getVar = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  cachedTheme = {
    blue: getVar("--blue", "#46BAEB"),
    green: getVar("--green", "#00BF63"),
    ink: getVar("--ink", "#0E1A1F"),
    surface: getVar("--surface", "#FFFFFF"),
    paper: getVar("--paper", "#F6FAF8"),
    line: getVar("--line", "#0E1A1F"),
    muted: getVar("--muted", "#52636A"),
    danger: getVar("--danger", "#D92D20"),
    warning: getVar("--warning", "#B54708"),
    onAccent: getVar("--on-accent", "#0E1A1F"),
  };
  lastThemeAttr = currentThemeAttr;
  return cachedTheme;
}
