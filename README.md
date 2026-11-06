# PaperTab

> Turn your browser's New Tab into a creative, customizable whiteboard, wallpaper, and scalable idea-dumping canvas.

PaperTab brings an Excalidraw-inspired sketching canvas directly to your New Tab page. Sketch diagrams, collect reference images, brainstorm ideas across hundreds of assets per board, or doodle freely—then switch to Wallpaper Mode to keep your artwork and handy widgets as your clean everyday desktop.

---

## Features

- **Hand-Drawn Sketching**: Rectangles, diamonds, ellipses, lines, arrows, freehand drawings, text, and rich image insertion.
- **Scalable Image & Asset Foundation**:
  - **IndexedDB Asset Store**: Full-resolution images stored in IndexedDB (`papertab_assets`) with SHA-256 byte deduplication. Ingestion is fully DOM-free (`createImageBitmap` + `OffscreenCanvas`).
  - **Multi-File Drag & Drop**: Drop dozens of images at once; automatically laid out in a clean grid around your cursor in a single undo step.
  - **Tab-to-Tab Image Dragging**: Drag images from web pages or external browser tabs directly onto the board with a visual sketchbook drop highlight.
  - **Level-of-Detail (LOD) & LRU Decoded Cache**: Automatically draws fast 320px WebP thumbnails when zoomed out and switches to high-resolution bitmaps when inspecting closely. Decoded bitmaps are managed by an LRU cache with a strict 256 MB decoded-pixel budget.
  - **Viewport Culling**: Viewport culling for all element types accounting for rotation angles, allowing smooth 60 FPS panning even on boards with hundreds of images and doodles.
  - **Auto-Arrange Layouts**: Select multiple elements and instantly organize them into **Grid**, **Masonry**, **Row**, or **Column** with customizable gap spacing in a single undo step.
  - **Image Captions & Links**: Add captions (with on-canvas toggle) and clickable external source URLs directly to images.
- **Dual-Mode Workflow**:
  - **Wallpaper Mode**: Clean, distraction-free new tab showcasing your artwork with handy widgets.
  - **Drawing Mode**: Full creative toolset with colors, roughness, stroke styles, and layers.
- **Align-Anywhere Widgets**: Drag and place your Digital Clock, Search Bar, and Quick Links anywhere on screen with grid snapping.
- **Multi-Scene Persistence**: Discrete per-scene storage (`scene:<id>` + `scenes_index`) supporting up to 100 scenes. Debounced auto-saving and instant-paint zero-flash preview cache.
- **Keyboard Shortcuts & Modal**: Press `?` anytime to view the complete shortcuts cheatsheet. Full support for `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+Z`, `Ctrl+Y`, `Ctrl+D`, nudge with arrow keys, and quick tool keys (`V`, `R`, `D`, `O`, `A`, `L`, `P`, `T`, `E`).
- **Export & Import**: Export artwork as high-resolution PNG or vector SVG (always rendering full original resolution, bypassing LOD), or backup/restore entire scenes as self-contained `.canvaswallpaper` bundles.
- **Local-First & Private**: No tracking, no user accounts, no telemetry, and no PaperTab servers. Your drawings, boards, notes, and visual assets are stored on your device in local extension storage and IndexedDB. See [PRIVACY.md](PRIVACY.md) and [docs/NETWORK-REQUESTS.md](docs/NETWORK-REQUESTS.md) for complete details on outbound requests (such as Quick Links favicons and search queries).

For design guidelines and UI token specifications, see [DESIGN.md](DESIGN.md).

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                      UI / Canvas                       │
│   CanvasRenderer (Viewport Culling, DPR, Transform)    │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
┌─────────────────────────┐         ┌────────────────────┐
│   Asset Loader (LOD)    │         │  useSceneStore     │
│  - 256MB LRU Cache      │         │  - 100 Boards      │
│  - Thumb / Full Tier    │         │  - Discrete Keys   │
│  - createImageBitmap    │         │  - Instant Preview │
└─────────────┬───────────┘         └─────────┬──────────┘
              ▼                               ▼
┌─────────────────────────┐         ┌────────────────────┐
│   IndexedDB Store       │         │ chrome.storage     │
│  - SHA-256 Dedupe       │         │  - scenes_index    │
│  - 7-day GC for orphan  │         │  - scene:<id>      │
└─────────────────────────┘         └────────────────────┘
```

---

## Installation

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Load into Chrome:
   - Open Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** in the top-right corner.
   - Click **Load unpacked** and select the `.output/chrome-mv3` folder.

---

## Shortcuts Cheatsheet

| Shortcut                                        | Action                                       |
| :---------------------------------------------- | :------------------------------------------- |
| **`?`**                                         | Open keyboard shortcuts cheatsheet           |
| **`E`**                                         | Enter Drawing mode (when in Wallpaper mode)  |
| **`Esc`**                                       | Exit Drawing mode / Deselect selection       |
| **`H`**                                         | Toggle UI preview (clean view)               |
| **`Ctrl + C`**                                  | Copy selected element(s)                     |
| **`Ctrl + V`**                                  | Paste element(s) (or images)                 |
| **`Ctrl + X`**                                  | Cut selected element(s)                      |
| **`Ctrl + D`**                                  | Duplicate selected element(s)                |
| **`Ctrl + Z` / `Ctrl + Y`**                     | Undo / Redo                                  |
| **`Arrow Keys`**                                | Nudge selected elements (`+ Shift` for 10px) |
| **`V`, `R`, `D`, `O`, `A`, `L`, `P`, `T`, `E`** | Switch drawing tools                         |

---

## Privacy & Terms

PaperTab does not track, collect, or transmit any user data. All sketches, images, and settings are stored locally in your browser (IndexedDB and local storage). Read our full [Privacy Policy](PRIVACY.md) and [Terms of Service](TERMS.md).

---

## Copyright & License

Copyright © 2026 PaperTab. All rights reserved. Proprietary software.
