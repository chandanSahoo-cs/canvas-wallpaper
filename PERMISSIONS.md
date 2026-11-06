# PaperTab Permissions Justification

This document details the exact justifications for all Chrome Extension (Manifest V3) permissions requested by PaperTab, suitable for Chrome Web Store review and user audits.

PaperTab is a **local-first** new-tab extension. It has no external backend, no telemetry, no analytics, and does not sell or transmit user data. All captured content and drawings remain on the user's local machine.

---

## 1. Install-Time Permissions (`permissions`)

### `storage`
* **Justification**: Required to persist user drawings, board metadata, widget configurations, and local Inbox items via `chrome.storage.local`.
* **Scope**: Stores JSON-serializable records for scene indices, board definitions, and user settings on the local machine.

### `unlimitedStorage`
* **Justification**: PaperTab allows users to create visual sketchbooks and store high-resolution reference images across multiple boards and the Inbox. The standard `chrome.storage.local` quota (10 MB) is insufficient for extensive user collections, and browser-managed IndexedDB can be subject to automatic cache eviction under storage pressure. This permission ensures user artwork, notes, and saved assets are never unexpectedly purged by the browser.

### `contextMenus`
* **Justification**: Enables users to capture inspiration while browsing via browser right-click context menus:
  - *"Save image to PaperTab"* — captures an image to the local Inbox.
  - *"Save link to PaperTab"* — captures a link to the local Inbox.
  - *"Save selection to PaperTab"* — captures selected text as a quote to the local Inbox.
  - *"Save page to PaperTab"* — saves the current page as a link card to the local Inbox.

---

## 2. Runtime Optional Permissions (`optional_host_permissions`)

### `https://*/*` (Optional Host Permission)
* **Why not requested at install time?**
  PaperTab strictly adheres to the principle of minimal privilege. Broad host permissions (`<all_urls>` or `*://*/*`) are **never** requested at installation time to protect user privacy and avoid alarming permission warnings.
* **When and how is it requested?**
  Requested strictly on-demand at runtime through a clear button in the extension's Settings dialog: *"Allow saving images from any site"*. In accordance with Chrome MV3 security policies, this request is triggered exclusively by an explicit user click gesture within the extension's settings page.
* **Justification**:
  When a user right-clicks an image on an external website and selects *"Save image to PaperTab"*, cross-origin security restrictions (CORS) may block the service worker from downloading the image binary. Granting optional host permission allows the extension to fetch the image bytes that the user explicitly chose to save.
* **Revocability**:
  Users can revoke this permission at any time directly from the Settings dialog with a single click.
* **Data Flow & Privacy**:
  - Image fetching occurs solely upon explicit user action (context-menu click or drop).
  - Fetched images are quantized, thumbnailed, and stored directly in the local browser IndexedDB.
  - PaperTab never monitors, records, or transmits web traffic, browsing history, or background network activity.
