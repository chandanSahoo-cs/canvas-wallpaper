# PaperTab — Onboarding Tour V2 Manual QA & Verification Checklist

> Extension: **PaperTab** (Chrome MV3 New-Tab Extension)  
> Guide Version: 2.0 (Audit Date: November 2026)  
> Scope: Onboarding Tour V2, Chapters, Popover Positioning, Keyboard Navigation, Accessibility, and Clean Teardown

---

## 1. Automated Verification Summary

Automated tests in `tests/critical-flows.test.js` verify:
1. **Static Anchor Consistency**: All `data-tour` target selectors defined in `src/lib/tour/chapters.ts` exist in the UI markup across `src/` (no missing or misspelled anchors).
2. **Dynamic Clamping & Flipping Math**: Pure coordinate calculation across 1280x720, 800x600, and boundary conditions (flipping from bottom to top, left to right, and margin clamping).
3. **Step Registry & Copy Constraints**: Every step description strictly enforces `<= 35 words` and valid chapter IDs.
4. **Chapter Persistence**: Completed chapters array updates without duplicates; version bump to `TOUR_VERSION = 2` ensures existing and new users receive the updated tour once.

To run the automated suite:
```bash
npm run compile
npm test
npm run build
```

---

## 2. Browser Environment Verification

### 2.1 First-Run Welcome Modal & Version Bump
- [ ] **Clean Install**: Load extension unpacked into Chrome with a fresh profile.
  - **Expected**: Welcome Modal appears centered on screen (`z-[90]`) with PaperTab icon, sketchbook title, 3 highlight cards (Infinite Sketchbook, Library & Search, Wallpaper & Widgets), and "Take a 60-Second Tour" button.
- [ ] **Skip Onboarding**: Click "Skip & Start Creating" or press `Escape`.
  - **Expected**: Modal closes immediately; `hasCompletedTour` is set to `true`; `papertab_tour_v2_completed` stored in `localStorage` and `chrome.storage.local`.
- [ ] **Version Upgrade**: If an existing user had `papertab_tour_completed: true` from V1, opening the updated extension sees `TOUR_VERSION = 2` and re-triggers the Welcome Modal once. Subsequent reloads do not flash the modal.

---

### 2.2 Core Tour Flow (~60 Seconds)
Launch the Core tour from the Welcome Modal or from Settings ("Take the Tour" -> "PaperTab Basics" -> Start).

- [ ] **Step 1 (Welcome Overview)**:
  - Placement: Centered modal card.
  - Copy: <= 35 words. Keycaps and badges styled in Brand Blue (`#46BAEB`).
- [ ] **Step 2 (Wallpaper & Action Dock)**:
  - Target: Anchors smoothly to `[data-tour="wallpaper-dock"]` at bottom-right.
  - Mode: Wallpaper mode.
  - Spotlight: Blue outline cutout with 72% dark backdrop mask.
- [ ] **Step 3 (Dual Mode & Switching)**:
  - Target: Anchors to `[data-tour="toolbar"]` at top-center.
  - Mode: Automatically transitions into Drawing mode.
  - Copy: Accurately explains: *"Press E in Wallpaper mode to sketch. When finished, press Esc or click the green Done button to return to your clean desktop wallpaper."*
- [ ] **Step 4 (Canvas Navigation & Zoom)**:
  - Target: Anchors to `[data-tour="toolbar"]`.
  - Explains Space+drag to pan and `Ctrl + Scroll` to zoom.
- [ ] **Step 5 (Fast Capture & Saving)**:
  - Target: Anchors to `[data-tour="inbox-button"]` on the toolbar.
  - Explains `Ctrl + V`, file drag-and-drop, and Inbox tray.
- [ ] **Step 6 (Finding Anything)**:
  - Target: Anchors to `[data-tour="library-button"]` on the toolbar.
  - Explains Library `M`, tag search, and duplicate detection.
- [ ] **Step 7 (Help & Cheatsheet)**:
  - Target: Anchors to `[data-tour="shortcuts-button"]` on the toolbar.
  - Last step shows "Done" button with green completion check. Clicking "Done" marks `core` as completed with green check badge in Settings.

---

### 2.3 On-Demand Chapter Walkthroughs

Test launching each on-demand chapter from **Settings dialog -> Take the Tour**:

#### Chapter: Collect & Web Capture (`collect`)
- [ ] Click "Start" on **Collect & Web Capture**.
- [ ] **Step 1 (Inbox Tray)**: Tour step's `onEnter` hook automatically opens the Inbox Tray (`useInboxStore.getState().setIsOpen(true)`). Target highlights `[data-tour="inbox-tray"]`.
- [ ] **Step 2 (Web Image Capture)**: Tour step's `onEnter` hook opens Settings Dialog; target points directly to `[data-tour="web-capture-permission"]`.
- [ ] **Step 3 (Drag & Drop)**: Closes Settings and highlights Toolbar.
- [ ] **Completion**: Marks `collect` as Done with green badge.

#### Chapter: Organize & Boards (`organize`)
- [ ] Click "Start" on **Organize & Boards**.
- [ ] **Step 1 (Multi-Scene Workspaces)**: Target highlights `[data-tour="scene-switcher"]` at top-left.
- [ ] **Step 2 (Sketching Properties)**: Target highlights `[data-tour="style-panel"]` at left.
- [ ] **Step 3 (Auto-Arrange Layouts)**: Target points to `[data-tour="auto-arrange"]`. If fewer than 2 elements selected, `optional: true` flag gracefully skips step without throwing error.
- [ ] **Step 4 (Image Notes & Lightbox)**: Target highlights Toolbar and explains caption editing and double-click Lightbox.

#### Chapter: Find & Library (`find`)
- [ ] Click "Start" on **Find & Library**.
- [ ] **Step 1 (Cross-Board Library)**: `onEnter` hook opens Library modal (`useLibraryStore.getState().setIsOpen(true)`). Popover renders ABOVE the full-screen modal at `z-[82]`.
- [ ] **Step 2 (Search)**: Points to search capabilities across captions and notes.
- [ ] **Step 3 (Tags & Color Search)**: Points to OKLab color filters and tags.
- [ ] **Step 4 (Detect & Merge Duplicates)**: Explains side-by-side duplicate comparison and 1-click merge.
- [ ] **Exit / Finish**: Library modal closes cleanly on tour exit.

#### Chapter: Wallpaper & Widgets (`wallpaper`)
- [ ] Click "Start" on **Wallpaper & Widgets**.
- [ ] **Step 1 (Canvas Textures & Overlays)**: Automatically switches Style Panel to Wallpaper tab (`[data-tour="wallpaper-tab"]`).
- [ ] **Step 2 (Accessories)**: Opens Settings dialog to `[data-tour="widgets-section"]`.
- [ ] **Step 3 (Drag & Align Widgets)**: Points to `[data-tour="widget-layout-section"]`.
- [ ] **Step 4 (New Tab Resurfacing)**: Points to `[data-tour="resurface-settings"]`.
- [ ] **Exit / Finish**: Settings closes cleanly.

#### Chapter: Keep it Safe (`safe`)
- [ ] Click "Start" on **Keep it Safe**.
- [ ] **Step 1 (Backup & Restore)**: Opens Settings to `[data-tour="backup-section"]`.
- [ ] **Step 2 (Storage Health)**: Points to `[data-tour="storage-health-section"]`.
- [ ] **Step 3 (Orphan Cleanup & Optimization)**: Points to storage cleanup actions.
- [ ] **Step 4 (Export Options)**: Points to Toolbar export options (PNG, SVG, scene bundle).
- [ ] **Exit / Finish**: Teardown restores state cleanly.

---

## 3. Responsive Viewport Testing

### 3.1 1280 x 720 (Standard HD Laptop)
- [ ] Open Chrome DevTools and set emulation to `1280 x 720`.
- [ ] Run through Core Tour and all 5 chapters.
- [ ] Verify: Popovers stay at least 16px away from screen edges; no text is clipped.
- [ ] Verify: Popovers flip vertically (bottom ↔ top) or horizontally (right ↔ left) when targets are near viewport boundaries.

### 3.2 800 x 600 (Compact Netbook / Minimized Window)
- [ ] Set emulation to `800 x 600`.
- [ ] Run through Core Tour.
- [ ] Verify: Popover clamps cleanly to `padding = 16px` from top, bottom, left, and right.
- [ ] Verify: Header, step descriptions, and Back/Next buttons remain fully readable and interactive.

---

## 4. Theme & Appearance Testing

### 4.1 Light Mode
- [ ] Set Chrome theme / PaperTab theme to **Light**.
- [ ] Verify: Popover renders warm cream paper card (`bg-surface`, `text-ink`, `border-line`, `shadow-hard`).
- [ ] Verify: Spotlight outline is crisp PaperTab Blue (`#46BAEB`).
- [ ] Verify: Action buttons use Brand Green (`#00BF63`) and Brand Blue (`#46BAEB`).

### 4.2 Dark Mode
- [ ] Set PaperTab theme in Settings to **Dark**.
- [ ] Verify: Popover switches to dark slate surface (`bg-[#0e1a1f]`), high-contrast ink text, and crisp borders.
- [ ] Verify: Keycaps retain legible brand blue highlight (`bg-brand-blue/15 text-brand-blue`).
- [ ] Verify: Spotlight cutout mask remains deep ink with 72% opacity, perfectly highlighting the target element.

---

## 5. Keyboard-Only Navigation & Accessibility (a11y)

- [ ] **Arrow Right / Enter**: Pressing `ArrowRight` or `Enter` advances to next step.
- [ ] **Arrow Left**: Pressing `ArrowLeft` goes back to previous step.
- [ ] **Escape**: Pressing `Escape` skips/exits the tour immediately.
- [ ] **Focus Trap**: Press `Tab` repeatedly while tour popover is open.
  - **Expected**: Focus cycles exclusively through popover focusable elements (Close `X`, Back button, Next/Done button). Focus does NOT escape to underlying canvas or dock.
- [ ] **Focus Restoration**:
  - Open Settings, focus the "Start Tour" button, and press Enter to launch a chapter.
  - Skip or complete the tour with `Esc`.
  - **Expected**: Focus is automatically restored to the element that triggered the tour.
- [ ] **Screen Reader Announcement**:
  - Verify screen-reader-only element: `<div class="sr-only" role="status" aria-live="polite">Step X of Y: Step Title</div>`.
  - Step updates are announced politely without interrupting ongoing screen reader speech.
- [ ] **Shortcut Suppression**:
  - While tour is active, press `V`, `R`, `D`, `M`, `I`, `Delete`, `Ctrl+Z`, `Ctrl+D`.
  - **Expected**: Canvas tools, modals, and drawing actions are suppressed; nothing changes on canvas underneath.
- [ ] **Canvas Pointer Block**:
  - Try to click or drag on the canvas behind the spotlight mask.
  - **Expected**: The full-screen click shield blocks all pointer interactions; no doodles or selections are created.

---

## 6. Clean Teardown Guarantee

- [ ] **Wallpaper Mode Entry**: Start tour while in Wallpaper mode. Walk through steps that switch to Drawing mode. Exit via `Esc` or "Done".
  - **Expected**: App restores user to Wallpaper mode.
- [ ] **Drawing Mode Entry**: Start tour while in Drawing mode. Walk through Wallpaper steps. Exit via `Esc`.
  - **Expected**: App restores user to Drawing mode.
- [ ] **Modal Teardown**: Start a chapter that opens a modal (e.g. Find & Library opens `LibraryModal`, Collect opens `InboxTray`, Wallpaper opens `SettingsDialog`).
  - Press `Esc` midway through the chapter.
  - **Expected**: All modals and trays close automatically; screen is left completely clean.
- [ ] **User Data Integrity**: Inspect boards, assets, and tags before and after running the tour.
  - **Expected**: ZERO elements added, modified, or deleted. Tour is 100% read-only.

---

## 7. Non-Blocking Subtle Hint Pill

- [ ] In Drawing mode, open the Inbox Tray (`I`) when the `collect` chapter is not yet completed.
  - **Expected**: A subtle non-blocking pill slides in at bottom-left: *"Take a 45s walkthrough of Collect & Web Capture?"*.
- [ ] Click "Tour": Starts `collect` chapter immediately.
- [ ] Click `X` (Dismiss): Dismisses pill; stores in `papertab_tour_v2_hint_dismissed`; hint never bothers user again for that feature.
- [ ] Verify pill never blocks canvas drawing, dock buttons, or typing.

---

## 8. DEV Helper `window.auditTour()`

- [ ] In development mode (`npm run dev`), open browser DevTools console.
- [ ] Run:
  ```js
  window.auditTour();
  ```
- [ ] **Expected Output**:
  - Console group `🧭 [PaperTab Tour V2 Audit]`.
  - Reports: `Status: ✅ ALL PASSING`.
  - Verified 6 chapters and 23 total steps.
  - Reports 0 clipped popovers and 0 missing anchors.
