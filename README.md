# Canvas Wallpaper

> Turn your browser's New Tab into a creative, customizable whiteboard and wallpaper.

Canvas Wallpaper brings an Excalidraw-inspired sketching canvas directly to your New Tab page. Sketch diagrams, take quick notes, brainstorm ideas, or doodle freely—then switch to Wallpaper Mode to keep your drawing as your clean everyday desktop.

---

## Features

- **Hand-Drawn Sketching**: Rectangles, diamonds, ellipses, lines, arrows, freehand drawings, text, and image insertion (via toolbar or clipboard paste).
- **Dual-Mode Workflow**:
  - **Wallpaper Mode**: Clean, distraction-free new tab showcasing your artwork with handy widgets.
  - **Drawing Mode**: Full creative toolset with colors, roughness, stroke styles, and layers.
- **Align-Anywhere Widgets**: Drag and place your Digital Clock, Search Bar, and Quick Links anywhere on screen with grid snapping.
- **Multi-Scene Switcher**: Maintain multiple wallpapers/canvases and switch between them anytime.
- **Keyboard Shortcuts & Modal**: Press `?` anytime to view the complete shortcuts cheatsheet. Full support for `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+Z`, `Ctrl+Y`, `Ctrl+D`, nudge with arrow keys, and quick tool keys (`V`, `R`, `D`, `O`, `A`, `L`, `P`, `T`, `E`).
- **Export & Import**: Export artwork as high-resolution PNG or vector SVG, or backup/restore entire scenes as `.canvaswallpaper` files.
- **100% Offline & Private**: No tracking, no external accounts, no telemetry. Everything is stored locally on your device.

---

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/chandanSahoo-cs/PaperTab.git
   cd PaperTab
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load into Chrome:
   - Open Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** in the top-right corner.
   - Click **Load unpacked** and select the `.output/chrome-mv3` folder.

---

## Shortcuts Cheatsheet

| Shortcut                                        | Action                                       |
| :---------------------------------------------- | :------------------------------------------- |
| **`?`**                                         | Open keyboard shortcuts cheatsheet           |
| **`E`**                                         | Toggle Drawing / Wallpaper mode              |
| **`H`**                                         | Toggle UI preview (clean view)               |
| **`Ctrl + C`**                                  | Copy selected element(s)                     |
| **`Ctrl + V`**                                  | Paste element(s) (or images)                 |
| **`Ctrl + X`**                                  | Cut selected element(s)                      |
| **`Ctrl + D`**                                  | Duplicate selected element(s)                |
| **`Ctrl + Z` / `Ctrl + Y`**                     | Undo / Redo                                  |
| **`Arrow Keys`**                                | Nudge selected elements (`+ Shift` for 10px) |
| **`V`, `R`, `D`, `O`, `A`, `L`, `P`, `T`, `E`** | Switch drawing tools                         |

---

## Privacy

Canvas Wallpaper does not track, collect, or transmit any user data. All sketches and settings are stored locally in your browser. Read our full [Privacy Policy](PRIVACY.md).

---

## License

[ISC License](LICENSE)
