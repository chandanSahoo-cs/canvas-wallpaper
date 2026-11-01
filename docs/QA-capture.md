# PaperTab Web Capture & Inbox — Manual QA Checklist

This document provides a comprehensive verification matrix for PaperTab's Web Capture, Inbox, and Link Card system. Because Chrome MV3 Service Workers, native context menus, and user gesture permissions cannot be headlessly simulated in standard automated test environments, follow this manual QA guide.

---

## 1. Permissions Strategy Verification

| Step | Action | Expected Result | Verified |
| :--- | :--- | :--- | :--- |
| **1.1** | Inspect `manifest.json` after `npm run build` | Install-time permissions contain only `storage`, `unlimitedStorage`, and `contextMenus`. Broad `host_permissions` are NOT present. `optional_host_permissions: ["https://*/*"]` is declared. | [ ] |
| **1.2** | Open Settings Dialog (`Settings` from Dock) | A "Web Image Capture" section appears with status pill ("Restricted" by default) and an "Allow Saving Images from Any Site" button. | [ ] |
| **1.3** | Click "Allow Saving Images from Any Site" | Browser prompts: *"PaperTab wants to access your data on all https sites"*. Clicking "Allow" updates the UI pill to "Allowed" (green) and shows "Revoke Permission". | [ ] |
| **1.4** | Click "Revoke Permission" | Permission is revoked via `chrome.permissions.remove()`. The status pill reverts to "Restricted" without error. | [ ] |
| **1.5** | Review `PERMISSIONS.md` | Clear justification suitable for Chrome Web Store review is documented. | [ ] |

---

## 2. Context Menu Capture Scenarios

Right-click any web content to verify the 4 registered menus:
- *"Save image to PaperTab"*
- *"Save link to PaperTab"*
- *"Save selection to PaperTab"*
- *"Save page to PaperTab"*

### 2.1 Image Capture Scenarios
| Test Case | Scenario / URL Example | Expected Behavior |
| :--- | :--- | :--- |
| **2.1.1 CORS-Friendly Image** | Right-click image on Unsplash / Wikimedia Commons | Image is fetched, ingested into IndexedDB with 320px thumbnail, OKLab palette, and dHash. Badge count on extension icon increments by 1 with green background (`#00BF63`). |
| **2.1.2 Hotlink-Protected / CORS-Blocked** | Right-click protected image (without optional host permission) | Fetch fails gracefully; item is saved as a `link` item with page URL and tab title. Action badge updates, and Inbox tray displays the one-time capture hint explaining CORS fallback. |
| **2.1.3 Base64 / Data URL Image** | Right-click an inline `data:image/png;base64,...` image | Data URL bytes are parsed, ingested into IndexedDB, and stored without network requests. |
| **2.1.4 Huge Image (> 25 MB)** | Image file exceeding 25 MB cap | Ingestion pipeline rejects payload to protect memory; gracefully logs warning and saves page link fallback. |
| **2.1.5 SVG Image** | Right-click `.svg` vector asset | SVG content-type is rejected to protect raster rendering pipeline; item falls back to link card. |
| **2.1.6 Burst Rate Limit** | Right-click save 12 times within 2 seconds | First 10 items process normally; items 11 and 12 are throttled by `BurstRateLimiter` (sliding window: max 10 requests per 5s). |

### 2.2 Text Selection Capture
| Test Case | Scenario | Expected Behavior |
| :--- | :--- | :--- |
| **2.2.1 Quote Capture** | Select a paragraph on any blog/article, right-click *"Save selection to PaperTab"* | Saved as a `text` item in Inbox with quoted text and source metadata (`url`, `title`, `savedAt`). |
| **2.2.2 HTML Sanitization** | Select text containing links, bold tags, or script tags | Raw HTML is stripped (`sanitizePlainText`); control characters are purged; text is treated strictly as plain text. |
| **2.2.3 Long Selection** | Select a text passage exceeding 5,000 characters | Text is cleanly truncated at 5,000 characters (`MAX_TEXT_LENGTH`). |

### 2.3 Link & Page Capture
| Test Case | Scenario | Expected Behavior |
| :--- | :--- | :--- |
| **2.3.1 Web Link** | Right-click any hyperlink -> *"Save link to PaperTab"* | Saved as a `link` item with target URL, link text, and referring page source. |
| **2.3.2 Dangerous Schemes** | Link with `javascript:`, `file:`, or `data:` scheme | Blocked by `validateHttpUrl`; capture is rejected safely. |
| **2.3.3 Full Page Save** | Right-click page background -> *"Save page to PaperTab"* | Saved as a `link` item with page URL, tab title, and favicon URL. |

---

## 3. Service Worker Lifecycle & Resilience

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **3.1 Worker Inactivity** | Wait 30 seconds for Chrome MV3 service worker to terminate (idle state in `chrome://extensions`). | Worker terminates cleanly. |
| **3.2 Context Menu Wakeup** | Right-click an image and click *"Save image to PaperTab"*. | Chrome immediately wakes up the service worker; `onClicked` event fires; image is ingested and saved into IndexedDB without dropped events. |
| **3.3 Action Click** | Click the PaperTab extension action icon in the toolbar. | Always opens a new tab with PaperTab (does not interfere with context menus or badge count). |

---

## 4. Inbox Tray UI & Interactions

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **4.1 Open Inbox** | Press shortcut `I` or click the Inbox button in the Toolbar. | Slide-out tray appears on the right edge with sketchbook paper & ink border, shadow, and unread count badge. |
| **4.2 Filter Tabs** | Click `All`, `New`, `Placed`, `Dismissed`. | Items filter reactively. Counter pills update accurately. |
| **4.3 Quick-Add Input** | Paste `https://news.ycombinator.com` into the top input and press `Enter`. | URL is detected and immediately added as a `link` item at the top of the inbox. |
| **4.4 Quick-Add Note** | Type `Remember to check contrast ratios` and press `Enter`. | Text is added as a `text` note item at the top of the inbox. |
| **4.5 Add to Board (Button)** | Click the `+` button on any Inbox item card. | Element is placed at the center of the current canvas viewport, selected, and marked as `Placed`. |
| **4.6 Drag and Drop** | Drag an Inbox card directly onto the canvas. | Element is placed exactly under the cursor drop point; item is marked as `Placed`. |
| **4.7 Grid All** | Click the green `Grid All` button in the Inbox header. | All unplaced/new items are arranged in a clean grid at viewport center; all are marked as `Placed`. |
| **4.8 Dismiss & Undo** | Click `X` to dismiss an item. | Item disappears from active list; snackbar appears at bottom: *"Item dismissed [Undo]"*. Clicking `Undo` restores it to `New`. |
| **4.9 One-Time Hint** | Trigger a CORS-fallback link item. | Inbox shows tip banner: *"Some images were saved as links... Enable broader web capture in Settings."* Clicking *"Open Settings"* opens Settings dialog directly. |

---

## 5. Link Cards & Canvas Features

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **5.1 Paste URL** | Copy a URL to clipboard, click canvas in drawing mode, press `Ctrl+V` | A sketchbook `LinkElement` card (rough border, Excalifont title, domain line, external arrow) is placed at viewport center. |
| **5.2 Drop URL** | Drag a link from another browser tab onto the canvas. | A `LinkElement` card is created at the drop coordinates. |
| **5.3 Ctrl/Cmd + Click** | Hold `Ctrl` (or `Cmd` on macOS) and click the link card. | Browser opens the target URL in a new tab with `rel="noopener noreferrer"`. Only `http://` and `https://` URLs are allowed. |
| **5.4 OpenGraph Metadata** | Paste a URL when optional host permission is enabled. | In the new-tab page, PaperTab resolves `og:title`, `og:image`, and `favicon` in the background and updates the card without blocking the UI. |
| **5.5 Text Quote Underline** | Place a text quote from the Inbox onto the board. | Text quote renders with Excalifont; the attribution/source line (`— ...`) is underlined as a link. |

---

## 6. Library Search Integration

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **6.1 Open Library** | Press `M` or click folder icon in Toolbar. | Full-screen Library modal opens. |
| **6.2 Inbox Filter** | Click the `Inbox` chip in the quick filter bar. | Grid filters to show only items originating from Web Capture and Inbox. |
| **6.3 Active Filter Chip** | Filter chip shows `Inbox Items` with a remove `X` button. | Clicking `X` clears the filter and restores all library items. |

---

## 7. Assumptions & Limitations

1. **Service Worker Sandbox & DOMParser**:
   - Chrome MV3 background service workers lack access to `window`, `document`, and `DOMParser`.
   - Consequently, OpenGraph metadata parsing (`og:title`, `og:image`) is executed on-demand in the **New Tab page context**, while the service worker strictly handles DOM-free image ingestion via `createImageBitmap` and `OffscreenCanvas`.

2. **CORS and Hotlink Protection**:
   - Remote servers may block external hotlinking or cross-origin `fetch` requests when credentials are omitted.
   - PaperTab never fails silently: when an image fetch is blocked, it automatically preserves the item as a web link with page source metadata and prompts the user via the Inbox tip banner.

3. **Chrome Permission User Gesture Requirement**:
   - `chrome.permissions.request()` requires a direct user gesture originating from an extension page. It cannot be invoked programmatically from a background service worker context-menu click.
   - The user must explicitly opt in via the Settings dialog toggle button.

4. **Zero-Telemetry Local Privacy**:
   - All captured items, images, thumbnails, notes, and links are stored 100% on-device in `chrome.storage.local` and IndexedDB.
   - Zero analytics, zero external API dependencies, and zero remote telemetry calls are made.
