import { TourStepConfig, ChapterInfo } from "./types";
import { useAppStore } from "../../store/useAppStore";
import { useLibraryStore } from "../library/store";
import { useInboxStore } from "../inbox/store";

export const CHAPTERS: ChapterInfo[] = [
  {
    id: "core",
    title: "PaperTab Basics",
    badge: "Essential Tour",
    description: "Get familiar with the new-tab canvas, action dock, drawing tools, and navigation.",
    estimatedSeconds: 60,
  },
  {
    id: "collect",
    title: "Collect & Web Capture",
    badge: "Collector",
    description: "Save images, links, and selections from any webpage straight into your Inbox.",
    estimatedSeconds: 45,
  },
  {
    id: "organize",
    title: "Organize & Boards",
    badge: "Studio",
    description: "Master multi-scene workspaces, auto-arrange layouts, and element styles.",
    estimatedSeconds: 45,
  },
  {
    id: "find",
    title: "Find & Library",
    badge: "Search",
    description: "Search 5,000+ assets instantly by text, tags, perceptual colors, and duplicates.",
    estimatedSeconds: 45,
  },
  {
    id: "wallpaper",
    title: "Wallpaper & Widgets",
    badge: "Desktop",
    description: "Customize background patterns, clock, search bar, and new-tab resurfacing.",
    estimatedSeconds: 45,
  },
  {
    id: "safe",
    title: "Keep it Safe",
    badge: "Security",
    description: "Export complete .zip backups, check storage health, and export vector SVG.",
    estimatedSeconds: 40,
  },
];

export const TOUR_STEPS: TourStepConfig[] = [
  /* ---------------- CORE TOUR (6 STEPS) ---------------- */
  {
    id: "core-welcome",
    chapterId: "core",
    targetSelector: "",
    badge: "PaperTab",
    title: "Welcome to PaperTab",
    description:
      "PaperTab turns your new tab into an aesthetic sketchbook and creative idea dump. It is 100% local-first, private, and lightning fast.",
    placement: "center",
    targetMode: "wallpaper",
  },
  {
    id: "core-dock",
    chapterId: "core",
    targetSelector: '[data-tour="wallpaper-dock"]',
    badge: "Control Dock",
    title: "Your Wallpaper & Action Dock",
    description:
      "Adjust widget layouts, browse template presets, open settings, or click the pencil button to jump straight into Drawing mode.",
    placement: "top",
    targetMode: "wallpaper",
  },
  {
    id: "core-mode-switch",
    chapterId: "core",
    targetSelector: '[data-tour="toolbar"]',
    badge: "Dual Mode",
    title: "Switching Between Modes",
    description:
      "Press E in Wallpaper mode to sketch. When finished, press Esc or click the green Done button to return to your clean desktop wallpaper.",
    placement: "bottom",
    targetMode: "drawing",
  },
  {
    id: "core-navigation",
    chapterId: "core",
    targetSelector: '[data-tour="toolbar"]',
    badge: "Navigation",
    title: "Canvas Navigation & Zoom",
    description:
      "Hold Space and drag to pan smoothly across the infinite whiteboard. Use Ctrl + Scroll to zoom in, and press Ctrl + 0 to reset center.",
    placement: "bottom",
    targetMode: "drawing",
  },
  {
    id: "core-saving",
    chapterId: "core",
    targetSelector: '[data-tour="inbox-button"]',
    badge: "Fast Capture",
    title: "Dumping & Saving Images",
    description:
      "Paste images with Ctrl + V or drag files directly onto the board. Captured web items land neatly in your Inbox tray ready to place.",
    placement: "bottom",
    targetMode: "drawing",
  },
  {
    id: "core-finding",
    chapterId: "core",
    targetSelector: '[data-tour="library-button"]',
    badge: "Library",
    title: "Finding Anything You Saved",
    description:
      "Press M or click the folder icon to open your Library. Search across boards by title, tags, perceptual colors, or detect duplicate images.",
    placement: "bottom",
    targetMode: "drawing",
  },
  {
    id: "core-help",
    chapterId: "core",
    targetSelector: '[data-tour="shortcuts-button"]',
    badge: "Quick Tips",
    title: "Shortcuts & Assistance",
    description:
      "Press ? anytime to view keyboard shortcuts. Toggle clean preview with H, or boundary markers with B. You're ready to sketch!",
    placement: "bottom",
    targetMode: "drawing",
  },

  /* ---------------- COLLECT CHAPTER (3 STEPS) ---------------- */
  {
    id: "collect-inbox",
    chapterId: "collect",
    targetSelector: '[data-tour="inbox-tray"]',
    badge: "Inbox Tray",
    title: "Web Capture & Inbox",
    description:
      "Press I to toggle your Inbox. Save images, links, and text notes from web pages, then drag cards directly onto your board.",
    placement: "left",
    targetMode: "drawing",
    onEnter: () => {
      useInboxStore.getState().setIsOpen(true);
    },
    onExit: () => {
      useInboxStore.getState().setIsOpen(false);
    },
  },
  {
    id: "collect-permission",
    chapterId: "collect",
    targetSelector: '[data-tour="web-capture-permission"]',
    badge: "Permissions",
    title: "Browser Context Menus",
    description:
      "Right-click any web image and choose 'Save to PaperTab'. Enable full web capture here for unrestricted local saving from any site.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useAppStore.getState().setIsSettingsOpen(true);
    },
    onExit: () => {
      useAppStore.getState().setIsSettingsOpen(false);
    },
  },
  {
    id: "collect-drop",
    chapterId: "collect",
    targetSelector: '[data-tour="toolbar"]',
    badge: "Drag & Drop",
    title: "Multi-File Ingestion",
    description:
      "Drag dozens of image files onto the canvas at once. PaperTab automatically arranges them in a neat grid around your cursor.",
    placement: "bottom",
    targetMode: "drawing",
  },

  /* ---------------- ORGANIZE CHAPTER (4 STEPS) ---------------- */
  {
    id: "organize-scenes",
    chapterId: "organize",
    targetSelector: '[data-tour="scene-switcher"]',
    badge: "Workspaces",
    title: "Multi-Scene Boards",
    description:
      "Create up to 100 isolated boards for study, daily work, moodboards, or sketches. Search, rename, and switch boards in one click.",
    placement: "bottom",
    targetMode: "drawing",
  },
  {
    id: "organize-styles",
    chapterId: "organize",
    targetSelector: '[data-tour="style-panel"]',
    badge: "Ink & Fill",
    title: "Sketching Properties",
    description:
      "Fine-tune stroke color, fill patterns (solid, hachure, cross-hatch), line roughness, opacity, and handwritten typography.",
    placement: "right",
    targetMode: "drawing",
  },
  {
    id: "organize-arrange",
    chapterId: "organize",
    targetSelector: '[data-tour="auto-arrange"]',
    badge: "Auto-Arrange",
    title: "Instant Layouts",
    description:
      "Select multiple elements and align them instantly into Grid, Masonry, Row, or Column layouts with customizable spacing.",
    placement: "right",
    targetMode: "drawing",
    optional: true,
  },
  {
    id: "organize-lightbox",
    chapterId: "organize",
    targetSelector: '[data-tour="toolbar"]',
    badge: "Inspection",
    title: "Image Notes & Lightbox",
    description:
      "Add captions and links in the Style Panel. Double-click any image to inspect it full-res with smooth wheel zoom and pan.",
    placement: "bottom",
    targetMode: "drawing",
  },

  /* ---------------- FIND & LIBRARY CHAPTER (4 STEPS) ---------------- */
  {
    id: "find-library",
    chapterId: "find",
    targetSelector: '[data-tour="library-modal"]',
    badge: "Search View",
    title: "Cross-Board Library",
    description:
      "Press M to open your unified Library. Browse every visual asset, note, and sketch across all boards in a virtualized 60 FPS grid.",
    placement: "center",
    targetMode: "wallpaper",
    onEnter: () => {
      useLibraryStore.getState().setIsOpen(true);
    },
    onExit: () => {
      useLibraryStore.getState().setIsOpen(false);
    },
  },
  {
    id: "find-search",
    chapterId: "find",
    targetSelector: '[data-tour="library-modal"]',
    badge: "Fast Search",
    title: "Instant Text & Note Search",
    description:
      "Search asset captions, notes, source URLs, page titles, and board names instantly with real-time fuzzy scoring.",
    placement: "top",
    targetMode: "wallpaper",
    onEnter: () => {
      useLibraryStore.getState().setIsOpen(true);
    },
    onExit: () => {
      useLibraryStore.getState().setIsOpen(false);
    },
  },
  {
    id: "find-tags-colors",
    chapterId: "find",
    targetSelector: '[data-tour="library-modal"]',
    badge: "Color Filter",
    title: "Tags & OKLab Color Search",
    description:
      "Organize assets with colored tag badges, or click color swatches to filter visually similar images using perceptual OKLab color distance.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useLibraryStore.getState().setIsOpen(true);
    },
    onExit: () => {
      useLibraryStore.getState().setIsOpen(false);
    },
  },
  {
    id: "find-duplicates",
    chapterId: "find",
    targetSelector: '[data-tour="library-modal"]',
    badge: "Deduplication",
    title: "Detect & Merge Duplicates",
    description:
      "Detect identical or near-duplicate assets using 64-bit dHash fingerprints. Compare side-by-side and merge them to reclaim storage.",
    placement: "center",
    targetMode: "wallpaper",
    onEnter: () => {
      useLibraryStore.getState().setIsOpen(true);
    },
    onExit: () => {
      useLibraryStore.getState().setIsOpen(false);
    },
  },

  /* ---------------- WALLPAPER & WIDGETS CHAPTER (4 STEPS) ---------------- */
  {
    id: "wallpaper-canvas",
    chapterId: "wallpaper",
    targetSelector: '[data-tour="wallpaper-tab"]',
    badge: "Background",
    title: "Canvas Textures & Overlays",
    description:
      "Switch to the Wallpaper tab in the Style Panel to set custom background colors, linear gradients, custom images, and dot/grid patterns.",
    placement: "right",
    targetMode: "drawing",
    onEnter: () => {
      useAppStore.getState().setStylePanelTab("wallpaper");
    },
  },
  {
    id: "wallpaper-widgets",
    chapterId: "wallpaper",
    targetSelector: '[data-tour="widgets-section"]',
    badge: "Accessories",
    title: "Clock, Date & Search",
    description:
      "Toggle digital clock (12h/24h), live date, quick links, and search bar (Google, DuckDuckGo, Bing, Brave) on your desktop.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useAppStore.getState().setIsSettingsOpen(true);
    },
    onExit: () => {
      useAppStore.getState().setIsSettingsOpen(false);
    },
  },
  {
    id: "wallpaper-layout",
    chapterId: "wallpaper",
    targetSelector: '[data-tour="widget-layout-section"]',
    badge: "Placement",
    title: "Drag & Align Widgets",
    description:
      "Click 'Drag & Position Widgets' to freely position clock, search, and shortcuts anywhere on screen with automatic grid snapping.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useAppStore.getState().setIsSettingsOpen(true);
    },
    onExit: () => {
      useAppStore.getState().setIsSettingsOpen(false);
    },
  },
  {
    id: "wallpaper-resurface",
    chapterId: "wallpaper",
    targetSelector: '[data-tour="resurface-settings"]',
    badge: "Resurfacing",
    title: "New Tab Resurfacing",
    description:
      "Pick what your new tab shows: Current board, Shuffle boards, Random item, or Daily pick. Items display full-screen with source captions.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useAppStore.getState().setIsSettingsOpen(true);
    },
    onExit: () => {
      useAppStore.getState().setIsSettingsOpen(false);
    },
  },

  /* ---------------- KEEP IT SAFE CHAPTER (4 STEPS) ---------------- */
  {
    id: "safe-backup",
    chapterId: "safe",
    targetSelector: '[data-tour="backup-section"]',
    badge: "Portability",
    title: "Complete .ZIP Backup & Restore",
    description:
      "Export your entire collection into a standalone .zip with manifest, boards, originals, and CSV. Restore anytime in Merge or Replace mode.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useAppStore.getState().setIsSettingsOpen(true);
    },
    onExit: () => {
      useAppStore.getState().setIsSettingsOpen(false);
    },
  },
  {
    id: "safe-health",
    chapterId: "safe",
    targetSelector: '[data-tour="storage-health-section"]',
    badge: "Diagnostics",
    title: "Storage Health & Diagnostics",
    description:
      "Inspect storage quota usage, top 10 largest assets, and verify database integrity across all stored media files.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useAppStore.getState().setIsSettingsOpen(true);
    },
    onExit: () => {
      useAppStore.getState().setIsSettingsOpen(false);
    },
  },
  {
    id: "safe-clean",
    chapterId: "safe",
    targetSelector: '[data-tour="storage-health-section"]',
    badge: "Optimization",
    title: "Orphan Cleanup & WebP",
    description:
      "Purge unreferenced images older than 7 days and re-compress oversize images to WebP to keep PaperTab lightweight and lean.",
    placement: "bottom",
    targetMode: "wallpaper",
    onEnter: () => {
      useAppStore.getState().setIsSettingsOpen(true);
    },
    onExit: () => {
      useAppStore.getState().setIsSettingsOpen(false);
    },
  },
  {
    id: "safe-export",
    chapterId: "safe",
    targetSelector: '[data-tour="toolbar"]',
    badge: "Export",
    title: "Export PNG, SVG & Scene Files",
    description:
      "Click Export in the toolbar to save high-res raster PNGs, clean vector SVGs, or shareable .canvaswallpaper scene bundles.",
    placement: "bottom",
    targetMode: "drawing",
  },
];
