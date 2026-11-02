# PaperTab — Comprehensive Feature Inventory & Audit

> Repository: **PaperTab** (Chrome MV3 New-Tab Extension)  
> Stack: WXT + React 19 + Tailwind CSS 4 + Zustand + Rough.js + IndexedDB  
> Document Version: 2.0 (Audit Date: November 2026)

---

## 1. User-Facing Feature Matrix

Below is an exhaustive inventory of every user-facing feature implemented in PaperTab. Every entry reflects actual code behavior verified in `src/`.

### 1.1 Dual Modes & Mode Switching

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wallpaper Mode** | Default on new tab | — | Wallpaper | `storage` | Clean, distraction-free desktop showcasing your artwork, background, and configured widgets. Drawing canvas is non-interactive (`pointer-events-none`). |
| **Drawing Mode** | Switch from Wallpaper | `E` (in Wallpaper) | Drawing | `storage`, `unlimitedStorage` | Full creative sketching whiteboard with toolbars, color/style palettes, scene switcher, and canvas interactions enabled. |
| **Enter Drawing Mode** | Wallpaper Dock (Pencil button) / Presets modal CTA | `E` | Wallpaper | None | Switches `useAppStore.mode` from `"wallpaper"` to `"drawing"`. Note: `E` ONLY enters drawing mode when currently in wallpaper mode. |
| **Exit Drawing Mode** | Toolbar (Green Check / "Done" button) | `Esc` (when no elements selected) | Drawing | None | Switches `useAppStore.mode` from `"drawing"` back to `"wallpaper"`. If elements are selected, `Esc` deselects first. |
| **Clean Preview Mode** | Toolbar (Eye icon) / Floating pill button | `H` | Drawing | None | Temporarily hides all UI chrome (toolbars, style panels, scene switcher) to preview canvas cleanly without leaving Drawing mode. Exited via floating pill or `H`. |
| **Wallpaper Boundary Marker** | Toolbar (Square dashed icon) | `B` | Drawing | None | Renders a high-contrast dashed frame marking the exact 16:9 / 1920x1080 wallpaper viewport so creators know what appears on screen in Wallpaper mode. |

---

### 1.2 Creative Suite & Drawing Tools

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Selection Tool** | Toolbar (Pointer icon) | `V`, `1` | Drawing | None | Select, move, resize, and rotate elements on canvas. Supports rubber-band box marquee selection and Shift+click multi-selection. |
| **Rectangle Shape** | Toolbar (Square icon) | `R`, `2` | Drawing | None | Draw hand-drawn rough rectangles. Shift+drag forces 1:1 square. Alt+drag draws from center outward. |
| **Diamond Shape** | Toolbar (Diamond icon) | `D`, `3` | Drawing | None | Draw hand-drawn rough rhombus/diamond shapes. Shift+drag forces 1:1 aspect ratio. Alt+drag draws from center. |
| **Ellipse / Circle Shape** | Toolbar (Circle icon) | `O`, `4` | Drawing | None | Draw hand-drawn rough ellipses and circles. Shift+drag constrains to perfect circle. Alt+drag draws from center. |
| **Arrow Tool** | Toolbar (MoveUpRight icon) | `A`, `5` | Drawing | None | Draw 2-point directional arrows with rough hand-drawn arrowheads. Shift+drag snaps angles to 15° increments. |
| **Line Tool** | Toolbar (Minus icon) | `L`, `6` | Drawing | None | Draw 2-point straight lines. Shift+drag snaps angles to 15° increments. |
| **Freehand Pencil** | Toolbar (Pencil icon) | `P`, `7` | Drawing | None | Freeform ink sketching with pressure simulation, smoothing, and rough hand-drawn stroke aesthetic. |
| **Text Tool** | Toolbar (Type icon) | `T`, `8` | Drawing | None | Click canvas to spawn an in-place WYSIWYG text editor (`InlineTextEditor`). Pressing Enter on a single selected text element also re-opens editor. |
| **Eraser Tool** | Toolbar (Eraser icon) | `E`, `9`, `0` | Drawing | None | Click or drag across elements to erase them instantly. Note: `E` switches to Eraser when already in Drawing mode. |
| **Image Insertion (File)** | Toolbar (ImageIcon button) | — | Drawing | `storage`, `unlimitedStorage` | Opens native file dialog. Ingests PNG, JPEG, WebP, GIF, AVIF up to 50MB into IndexedDB with SHA-256 deduplication; places at canvas center. |
| **Image Insertion (Paste)** | Global canvas paste handler | `Ctrl + V` / `Cmd + V` | Drawing | `storage`, `unlimitedStorage` | Pastes image from system clipboard directly onto canvas at cursor coordinates or viewport center; automatically stored in IndexedDB. |
| **Image Insertion (Drop)** | Global canvas drag-and-drop | Drag & Drop | Drawing | `storage`, `unlimitedStorage` | Drag image files from file manager or images from web pages/tabs. Shows dashed blue drop target. Multiple images arrange automatically in a neat grid around cursor. |

---

### 1.3 Canvas Navigation & View Controls

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pan Canvas** | Canvas viewport | `Space + Drag` / Middle-click Drag | Drawing | None | Smooth infinite canvas panning. Dragging with spacebar held moves the viewport camera smoothly. |
| **Horizontal Pan** | Canvas viewport | `Shift + Scroll` | Drawing | None | Scroll wheel with Shift pans viewport horizontally. |
| **Zoom Viewport** | Toolbar Zoom Controls (`-` / `+`) | `Ctrl + Scroll` / `Ctrl + +` / `Ctrl + -` | Drawing | None | Zooms canvas between 0.5x (50%) and 5.0x (500%) anchored to pointer or center. |
| **Reset Zoom & Center** | Toolbar Zoom Pill ("100%") | `Ctrl + 0` / `Cmd + 0` | Drawing | None | Resets zoom scale to 1.0 (100%) and centers the camera view at origin coordinate `(0, 0)`. |
| **Center to Origin** | Canvas viewport | `Shift + 0` | Drawing | None | Centers camera view to coordinate `(0, 0)` while preserving current zoom magnification. |
| **Performance Stress Test**| Toolbar (Zap icon, DEV/Debug) | — | Drawing | None | Generates 150 randomized rough shapes and doodles across the canvas to stress-test 60 FPS viewport culling and rendering pipeline. |

---

### 1.4 Element Editing, Layering & Organization

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Undo / Redo** | Toolbar (Undo2 / Redo2 icons) | `Ctrl + Z` / `Ctrl + Y` (`Ctrl + Shift + Z`) | Drawing | None | Full transactional history stack with state snapshots and undo/redo buttons. |
| **Duplicate Selection** | Style Panel (Duplicate button) | `Ctrl + D` / `Alt + Drag` | Drawing | None | Clones selected elements with a +20px offset, or duplicates on drag while holding Alt. |
| **Copy / Cut / Paste Elements** | Canvas clipboard handlers | `Ctrl + C` / `Ctrl + X` / `Ctrl + V` | Drawing | None | Copies or cuts selected element definitions to internal clipboard; pastes with offset. |
| **Delete Selection** | Style Panel (Trash2 button) | `Delete` / `Backspace` | Drawing | None | Deletes all currently selected elements in a single undoable step. |
| **Select All Unlocked** | Canvas viewport | `Ctrl + A` / `Cmd + A` | Drawing | None | Selects all elements in current scene that are not locked. |
| **Nudge Elements** | Canvas viewport | `Arrow Keys` (`Shift + Arrow`) | Drawing | None | Nudges selected elements by 1px (or 10px when holding Shift). Saves history upon key release. |
| **Flip Horizontal / Vertical** | Style Panel (Flip buttons) | `Shift + H` / `Shift + V` | Drawing | None | Flips selected elements across their collective bounding box center axis. |
| **Bring Forward / Send Backward** | Style Panel (Layer buttons) | `Ctrl + ]` / `Ctrl + [` | Drawing | None | Reorders selected elements within the scene's z-order stack. |
| **Group / Ungroup** | Style Panel (Group/Ungroup buttons)| `Ctrl + G` / `Ctrl + Shift + G` | Drawing | None | Combines multiple selected elements into a single composite group with shared selection bounds; or dissolves group. |
| **Lock / Unlock** | Style Panel (Lock icon) | `Ctrl + Shift + L` | Drawing | None | Locks elements against selection, dragging, and deletion to protect backdrop sketches. |
| **Auto-Arrange Layouts** | Style Panel (Grid / Masonry / Row / Column buttons) | — | Drawing | None | When 2+ elements are selected, rearranges them into Grid, Masonry, horizontal Row, or vertical Column with adjustable spacing slider (3px–100px) in a single undo step. |
| **Image Captions & Links** | Style Panel (Image Details Section)| — | Drawing | None | Attach custom text caption, toggle on-canvas caption badge visibility, and attach clickable external source URL with favicon/link icon. |
| **Full-Resolution Lightbox**| Double-click image element | Double-click | Drawing | None | Inspects full original resolution image with wheel zoom (0.25x–8x), drag panning, asset metadata, color swatches, tags, copy, download, and set-as-wallpaper. |

---

### 1.5 Styles & Wallpaper Customizer (Style Panel)

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stroke Color** | Style Panel (Styles tab) | — | Drawing | None | Swatches palette + custom HEX color picker for element outlines and ink strokes. |
| **Fill Color** | Style Panel (Styles tab) | — | Drawing | None | Swatches palette + custom HEX color picker for shape interior fills. |
| **Fill Style** | Style Panel (Styles tab) | — | Drawing | None | Toggle between `Solid` (opaque), `Hachure` (sketchy diagonal strokes), and `Cross-hatch` (cross-hatched lines). |
| **Stroke Style** | Style Panel (Styles tab) | — | Drawing | None | Toggle outline rendering: `Solid`, `Dashed`, or `Dotted`. |
| **Stroke Width** | Style Panel (Styles tab) | — | Drawing | None | Adjust line thickness: Thin (1px), Medium (2px), Bold (4px), Extra Bold (6px). |
| **Roughness Slider** | Style Panel (Styles tab) | — | Drawing | None | Adjust Rough.js jitter: 0.0 (straight/precise) to 2.5 (expressive/wobbly hand-drawn). |
| **Opacity Slider** | Style Panel (Styles tab) | — | Drawing | None | Controls transparency from 10% to 100%. |
| **Font Family & Size** | Style Panel (Styles tab) | — | Drawing | None | Handwritten Virgil, Clean Sans, or Monospace font family, with small/medium/large/extra-large sizes. |
| **Wallpaper Background Color**| Style Panel (Wallpaper tab) | — | Drawing | None | Custom background canvas color or preset swatches (Warm Cream, Slate, Dark, etc.). |
| **Wallpaper Gradient** | Style Panel (Wallpaper tab) | — | Drawing | None | Linear gradient background with dual color stops and angle selector (0° to 315°). |
| **Wallpaper Background Image**| Style Panel (Wallpaper tab) | — | Drawing | `storage`, `unlimitedStorage` | Upload custom image as canvas backdrop with Cover or Contain fit. |
| **Pattern Overlays** | Style Panel (Wallpaper tab) | — | Drawing | None | Overlay textures: None, Fine Dots (dot grid), Graph Grid, Lined Ruled Paper, Cross-hatch. |

---

### 1.6 Multi-Scene Board Management

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scene Switcher Pill** | Top-left corner (`SceneSwitcher`) | — | Drawing | `storage` | Displays active board name and background color indicator dot. Click to expand dropdown. |
| **Switch Scene** | Scene Switcher dropdown | — | Drawing | `storage` | Instantly switch between up to 100 isolated boards. Each board maintains discrete elements, camera position, and background config. |
| **Create Board** | Scene Switcher (`+` button) | — | Drawing | `storage` | Creates a new blank board with default background (capped at 100 boards). |
| **Search Boards** | Scene Switcher dropdown input | — | Drawing | None | Real-time text filter to quickly find boards by name. |
| **Rename Board** | Scene Switcher (Pencil icon) | — | Drawing | `storage` | Inline editing of board titles with keyboard Enter to save. |
| **Delete Board** | Scene Switcher (Trash icon) | — | Drawing | `storage` | Deletes board and cleans up discrete storage key `scene:<id>`. Guarded against deleting the last remaining board. |
| **Presets Gallery Dialog** | Wallpaper Dock (LayoutTemplate icon) / Scene Switcher | — | Both | `storage` | Browse signature presets including "Playful Doodles" (251 curated hand-drawn vector elements). Apply to current scene or create as new board. |

---

### 1.7 Wallpaper Dock & Align-Anywhere Widgets

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wallpaper Dock** | Bottom-right corner | — | Wallpaper | None | Floating action micro-dock providing access to Presets, Settings, Widget Layout Customizer, Keyboard Shortcuts, and Draw mode CTA. |
| **Digital Clock Widget** | Desktop viewport | — | Wallpaper / Preview | `storage` | Live real-time clock with configurable 12-hour (AM/PM) or 24-hour display format. |
| **Date & Day Widget** | Desktop viewport | — | Wallpaper / Preview | `storage` | Displays current weekday, month, and day in sketchbook font. |
| **Search Bar Widget** | Desktop viewport | — | Wallpaper / Preview | `storage` | Instant web search bar with dropdown engine selector: Google, DuckDuckGo, Bing, Brave. |
| **Quick Links Widget** | Desktop viewport | — | Wallpaper / Preview | `storage` | Customizable shortcut bookmarks with titles, URLs, and favicons. |
| **Spatial Widget Layout** | Settings / Wallpaper Dock (LayoutGrid icon) | — | Wallpaper | `storage` | Full-screen interactive drag-and-drop layout editor. Reposition widgets anywhere with visual alignment guides. |
| **Reset Widget Layout** | Settings (Reset button) | — | Wallpaper | `storage` | Resets all widgets back to default anchor positions. |
| **Master Widget Toggle** | Settings dialog ("All Widgets") | — | Both | `storage` | One-click master toggle to show or hide all widgets on the screen. |

---

### 1.8 New Tab Resurfacing Engine

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Resurface Mode Selector** | Settings dialog ("New Tab Shows") | — | Both | `storage` | Synchronous zero-flash new-tab selection: `Current Board` (default), `Shuffle Boards`, `Random Item`, or `Daily Pick`. |
| **Random Item Display** | Wallpaper mode desktop | — | Wallpaper | `storage` | Displays a high-resolution image asset full-screen with Cover or Contain fit. |
| **Resurfaced Overlay** | Bottom-left screen overlay | — | Wallpaper | None | Displays title, custom caption, and clickable source URL card for the resurfaced item. |
| **Resurface Dock Controls**| Wallpaper Dock (when resurfacing active) | — | Wallpaper | `storage` | Shuffle button ("Show another pick"), Pin button ("Pin this as active board/wallpaper"), and EyeOff button ("Never show again"). |
| **Exclusion List Management**| Settings dialog | — | Both | `storage` | View all "Never show again" excluded item IDs with individual remove buttons and a "Clear all" button. |

---

### 1.9 Web Content Capture & Inbox Tray

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Capture Image Context Menu** | Browser right-click menu on any `<img>` | — | Global | `contextMenus`, optional `https://*/*` | Saves image directly into PaperTab Inbox: byte deduplication via SHA-256, 320px WebP thumbnail, OKLab palette & dHash extraction. |
| **Capture Link Context Menu** | Browser right-click menu on any link | — | Global | `contextMenus`, optional `https://*/*` | Saves link card into Inbox with OpenGraph preview image, page title, and URL. |
| **Capture Selection Menu** | Browser right-click menu on text selection | — | Global | `contextMenus` | Saves highlighted text snippet as a text note card in Inbox. |
| **Capture Page Context Menu** | Browser right-click menu on page background | — | Global | `contextMenus` | Saves current page title and URL into Inbox. |
| **Optional Host Permission**| Settings dialog ("Web Image Capture") | — | Both | `optional_host_permissions: ["https://*/*"]` | On-demand button to request or revoke Chrome `https://*/*` permission for saving images across any website. Transparent privacy explanation. |
| **Inbox Tray** | Drawing mode top-right / Toolbar (Inbox icon) | `I` | Drawing | `storage`, `unlimitedStorage` | Slide-out tray with unread badge counter. Lists captured images, links, and text notes. |
| **Inbox Quick Add** | Inbox Tray top input | Enter | Drawing | None | Type or paste any URL or text note directly into the Inbox. |
| **Inbox Filter Tabs** | Inbox Tray tabs | — | Drawing | None | Filter cards by `All`, `Unplaced` (new), `Placed`, or `Dismissed`. |
| **Drag & Drop to Canvas** | Inbox item card | Drag | Drawing | None | Drag card directly from Inbox onto canvas to place it at release coordinates. |
| **Place Item CTA** | Inbox item card (Check icon) | — | Drawing | None | Places item at viewport center in one click. |
| **Place All as Grid** | Inbox Tray header (LayoutGrid icon) | — | Drawing | None | Places all unplaced inbox items onto the canvas simultaneously in an organized grid layout. |
| **Dismiss / Undo Dismiss** | Inbox item card (X / RotateCcw icon) | — | Drawing | None | Dismisses item from active view with undo support. |

---

### 1.10 Library & Unified Search

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Library View** | Toolbar (Folder icon) | `M` | Both | `storage`, `unlimitedStorage` | Full-screen modal with virtualized windowed grid displaying up to 5,000+ assets smoothly at 60 FPS. |
| **Unified Search Bar** | Library Toolbar input | — | Both | None | Local search across asset text, notes, captions, source URLs, page titles, and tag names. |
| **Sort Selector** | Library Toolbar dropdown | — | Both | None | Sort assets by `Newest`, `Oldest`, `Size` (bytes), or `Hue` (OKLab color wheel). |
| **Filter Chips** | Library Toolbar filter bar | — | Both | None | Filter by Tag, Board, Type (Image/Text), Color swatch, Date range, "Not on any board", and "Duplicates". Removable active filter chips. |
| **Tag Manager** | Library Toolbar ("Manage Tags") | — | Both | `storage` | Create, rename, delete custom tags; assign one of 6 distinct color badges (`blue`, `green`, `amber`, `purple`, `rose`, `teal`). |
| **Color Search & Palette** | Library Toolbar / Palette Extractor | — | Both | None | Filter library items by matching perceptual OKLab dominant colors (distance threshold). |
| **Duplicate Detection & Merge**| Library ("Duplicates" filter / Merge dialog) | — | Both | `storage` | Detects duplicate assets using SHA-256 and 64-bit dHash Hamming distance (<= 10). Side-by-side comparison and 1-click merge (repoints references and deletes duplicate). |
| **Locate on Board** | Library card action (Locate button) | — | Both | None | Switches active scene and pans camera directly to the element on its board. |
| **Batch Selection Bar** | Library bottom floating bar | — | Both | None | Multi-select assets in library to batch-assign tags, batch-delete, or clear selection. |
| **Rebuild Search Index** | Settings dialog ("Search Index") | — | Both | None | Manually triggers full re-indexing of all assets, scenes, and text elements. |

---

### 1.11 Export, Backup & Data Portability

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Export PNG Image** | Toolbar Export Menu ("Export as PNG") | — | Drawing | None | High-resolution raster PNG export of current scene. Automatically renders full original image resolutions (bypassing LOD thumbnails). |
| **Export SVG Vector** | Toolbar Export Menu ("Export as SVG") | — | Drawing | None | Clean vector SVG export of hand-drawn rough elements, text, and embedded images. |
| **Export Scene File** | Toolbar Export Menu ("Save Scene File") | — | Drawing | None | Downloads standalone `.canvaswallpaper` JSON file containing complete scene element graph and background config. |
| **Full Backup (.zip)** | Settings / Backup Reminder Banner ("Backup & Restore") | — | Both | `storage`, `unlimitedStorage` | Creates a comprehensive dependency-free `.zip` archive containing `manifest.json`, discrete `scenes/*.json`, full original `assets/*`, `library.json`, and `sources.csv`. |
| **Restore Backup (.zip)** | Backup Modal ("Restore Backup") | — | Both | `storage`, `unlimitedStorage` | Inspects backup zip, verifies manifest and element counts, guards against path traversal (zip-slip), and restores data in `Merge` (append) or `Replace` (clean wipe) mode. |
| **7-Day Backup Reminder** | Bottom-right non-blocking banner | — | Both | `storage` | Friendly banner nudging the user to export a backup if 7+ days have elapsed since last backup. Dismissible. |

---

### 1.12 Storage Diagnostics & Maintenance

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Storage Health Diagnostics**| Settings dialog ("Storage Health") | — | Both | `storage` | Visual quota usage meter (used bytes vs quota), breakdown of originals vs thumbnails vs scene JSON, and top 10 largest stored assets table. |
| **Orphan Asset Cleanup** | Storage Health modal ("Clean Up Orphans") | — | Both | `storage` | Scans IndexedDB and deletes unreferenced assets older than 7 days that are not attached to any scene or inbox item. |
| **Storage Optimization** | Storage Health modal ("Optimize Storage") | — | Both | `storage` | Re-compresses oversize JPEG/PNG originals to high-quality WebP (0.9 quality) to reclaim disk quota. |
| **Database Integrity Check**| Storage Health modal ("Check Integrity") | — | Both | `storage` | Verifies consistency across IndexedDB blobs, thumbnail records, and scene element pointers. |
| **Idle Metadata Backfill** | Bottom-left indicator pill (when active)| — | Both | None | Low-priority idle-time worker calculating dHash fingerprints and OKLab palettes for legacy or unindexed assets. Cancellable. |

---

### 1.13 Help, Appearance & System

| Feature | UI Location | Shortcut | Mode | Permissions | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Appearance Theme** | Settings dialog ("Appearance Theme") | — | Both | `storage` | Select `System`, `Light`, or `Dark` theme for Chrome UI chrome, dialogs, popovers, and text (operates independently from wallpaper canvas colors). |
| **Keyboard Shortcuts Cheatsheet**| WallpaperDock (Keyboard icon) / Toolbar / `?` key | `?` | Both | None | Full modal cheatsheet displaying shortcuts organized into 4 categories: Drawing Tools, Edit & Clipboard, Navigation & View, Layers & Groups. |
| **Feature Walkthrough Tour** | Settings ("Feature Walkthrough") / Shortcuts modal footer | — | Both | `storage` | Step-by-step interactive onboarding tour guiding the user through PaperTab. |
| **Privacy Policy Dialog** | Settings dialog / Shortcuts modal footer | — | Both | None | Displays PaperTab's 100% local-first privacy commitment: no tracking, no analytics, no external servers. |

---

## 2. Inaccuracy & Bug Audit

Below is a detailed audit of discrepancies discovered between the existing codebase implementation, the old onboarding tour, `ShortcutsDialog.tsx`, and `README.md`.

### 2.1 Onboarding Tour & Welcome Modal (`OnboardingTour.tsx` & `useOnboardingStore.ts`)

1. **Target Anchor Bug: `#tour-scene-switcher` does not exist**:
   - `useOnboardingStore.ts` Step 4 defines `targetSelector: "#tour-scene-switcher"`.
   - Inspection of `SceneSwitcher.tsx` and `App.tsx` shows **no element has `id="tour-scene-switcher"`**.
   - Consequence: Target lookup always fails, causing the tour engine to silently drop the spotlight and display a generic centered popover instead of pointing to the switcher.
2. **Copy Inaccuracy: `E` key toggle description is false**:
   - Step 5 (`shortcuts-complete`) copy claims: *"Press E to quickly toggle between Wallpaper and Drawing mode."*
   - Real Code Behavior in `useKeyboardShortcuts.ts`:
     - In Wallpaper mode: `E` switches to Drawing mode (`setMode("drawing")`).
     - In Drawing mode: `E` selects the **Eraser tool** (`setTool("eraser")`)!
     - Pressing `E` while in Drawing mode does **NOT** return to Wallpaper mode.
     - Users return to Wallpaper mode by pressing `Esc` (when no elements are selected) or clicking the green "Done" button on the toolbar.
3. **Shortcut Interference During Active Tour**:
   - `useKeyboardShortcuts.ts` does not inspect `useOnboardingStore.getState().isTourActive`.
   - While the tour is active, pressing single keys like `V`, `R`, `D`, `M`, `I`, `Delete`, `H`, etc. continues to trigger canvas tools, open modals, and mutate state behind the spotlight backdrop.
4. **Hardcoded Popover Dimensions**:
   - `getPopoverStyle()` hardcodes `POPOVER_WIDTH = 340` and `POPOVER_HEIGHT = 200`.
   - On smaller viewports (e.g., 800x600 or 1280x720) or with dynamic step content, popovers overflow screen bounds or clip text descriptions.
5. **Lack of Step Lifecycle Hooks & Modal Orchestration**:
   - The old tour has no `onEnter` or `onExit` step hooks.
   - Consequently, the tour was unable to open or showcase any modal or drawer features (Settings, Library, Inbox, Lightbox, Backup, Storage Health).
6. **Vastly Incomplete Feature Coverage**:
   - The old tour had only 5 static steps covering only the dock, basic tools, style panel, and shortcuts. It completely omitted:
     - Library & Search (`M`)
     - Web Image Capture & Inbox Tray (`I`)
     - Resurfacing on New Tab
     - Lightbox viewer
     - Backup & Restore (.zip)
     - Storage Health diagnostics
     - Auto-arrange layouts

---

### 2.2 Keyboard Shortcuts Cheatsheet (`ShortcutsDialog.tsx`)

1. **Missing Tool `0` Shortcut**:
   - In `useKeyboardShortcuts.ts` (lines 27-28), both `"9"` and `"0"` map to the Eraser tool (`"9": "eraser"`, `"0": "eraser"`).
   - `ShortcutsDialog.tsx` line 32 only lists `E, 9`. Tool key `0` is completely omitted.
2. **Missing Select All (`Ctrl + A` / `Cmd + A`)**:
   - `useKeyboardShortcuts.ts` lines 169-174 implements `Ctrl + A` to select all unlocked elements.
   - `ShortcutsDialog.tsx` under "Edit & Clipboard" completely omits `Ctrl + A`.
3. **Missing Redo Alternative (`Ctrl + Shift + Z`)**:
   - `useKeyboardShortcuts.ts` lines 136-141 supports standard `Ctrl + Shift + Z` for Redo.
   - `ShortcutsDialog.tsx` line 50 only lists `Ctrl + Y`.
4. **Missing Text Element Edit (`Enter`)**:
   - `useKeyboardShortcuts.ts` lines 122-134 triggers the WYSIWYG text editor when `Enter` is pressed on a single selected text element.
   - Not documented in `ShortcutsDialog.tsx`.
5. **Missing Multi-Selection Modifiers**:
   - Shift+Click and Marquee box selection are core canvas selection mechanics, but not referenced in the cheatsheet.
6. **Missing Lightbox Trigger**:
   - Double-clicking an image element opens the full-resolution Lightbox viewer, but this interaction is not documented in the cheatsheet.

---

### 2.3 Documentation (`README.md`)

1. **Outdated Feature List**:
   - `README.md` lists features from early asset iterations, but completely lacks any mention of:
     - **Unified Library & Search Engine** (`M` key, virtualized grid, tags, OKLab color search, duplicate detection & merging).
     - **Web Content Capture & Context Menus** (saving images, links, text, and pages into Inbox Tray `I`, optional host permissions).
     - **New Tab Resurfacing** (Shuffle boards, Random item, Daily pick, wallpaper item display, exclusion list).
     - **Full-Resolution Lightbox** (zoom, pan, copy image, download original, set as wallpaper).
     - **Dependency-Free ZIP Backup & Restore** (`.zip` import/export with manifest, scenes, assets, and CSV).
     - **Storage Health & Optimization** (quota analytics, largest items, orphan cleanup, WebP re-compression).
2. **Incomplete Shortcuts Table in README**:
   - The shortcuts table in `README.md` (lines 80-93) lists only 11 shortcuts.
   - Omitted shortcuts:
     - `M` (Open Library & Search)
     - `I` (Toggle Web Capture Inbox)
     - `B` (Toggle wallpaper boundary marker)
     - `Ctrl + A` (Select all unlocked elements)
     - `Ctrl + G` / `Ctrl + Shift + G` (Group / Ungroup)
     - `Ctrl + Shift + L` (Lock / Unlock)
     - `Ctrl + 0` (Reset zoom & center to origin)
     - `Shift + 0` (Center to origin)
     - `Ctrl + +` / `Ctrl + -` (Zoom in / out)
     - `Shift + H` / `Shift + V` (Flip horizontally / vertically)
     - `Ctrl + ]` / `Ctrl + [` (Bring forward / Send backward)
3. **Inaccurate Architecture Diagram**:
   - The architecture ASCII diagram in `README.md` only references `CanvasRenderer`, `Asset Loader`, `useSceneStore`, and `chrome.storage`. It does not show `LibraryStore`, `InboxStore`, `ResurfaceStore`, `BackupManager`, or the service worker capture pipeline.
