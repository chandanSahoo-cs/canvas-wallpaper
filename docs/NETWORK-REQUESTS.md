# PaperTab Outbound Network Requests Audit

PaperTab does not have user accounts, analytics, tracking, or PaperTab-operated backend servers. Your visual assets, drawings, inbox captures, and board configurations are stored locally on your device in IndexedDB and `chrome.storage.local`.

However, the extension does initiate outbound network requests in specific user-triggered or user-configured scenarios. This document catalogues every outbound request made by PaperTab.

## Outbound Requests Table

| Feature / Location | Trigger | Destination | Data Transmitted | User Control & Permissions |
|---|---|---|---|---|
| **Quick Links Favicons**<br>`src/widgets/QuickLinks.tsx` | Rendering quick links on new tab page when Quick Links widget is active | `https://www.google.com/s2/favicons?domain=...&sz=64` (Google Favicon Service) | Hostname / domain of the configured quick link | User adds, edits, or deletes quick links; can disable the Quick Links widget entirely in Settings. |
| **Search Bar Submissions**<br>`src/widgets/SearchBar.tsx` | User submits a query in the new tab search bar widget | User's selected search engine (`google.com`, `duckduckgo.com`, `bing.com`, or `search.brave.com`) | Search query string (`?q=...`) | User types the query and explicitly submits; user selects preferred search engine or disables search bar widget in Settings. |
| **Context Menu Image Capture**<br>`entrypoints/background.ts` | User right-clicks an image on a webpage and selects "Save image to PaperTab" | The original image host URL (`srcUrl`) | HTTP GET request with credentials omitted | Explicit user context-menu action. Direct fetch runs on-demand; optional host permission (`https://*/*`) can be granted or revoked in Settings. |
| **Link Preview & Favicon Resolution**<br>`src/lib/inbox/ogResolver.ts` | Enriching a link card added or placed on a board | Target website origin, OpenGraph image URL, and favicon URL | HTTP GET request with credentials omitted (bounded by 25 MB image cap, 512 KB HTML/favicon cap, 15s timeout) | Requires user opt-in to optional host permissions (`https://*/*`). If permission is not granted, resolution is skipped. Permission can be revoked at any time in Settings. |
| **Canvas Drag-and-Drop External Image**<br>`src/hooks/useCanvasDrop.ts` | User drags and drops an external image from another browser tab onto the canvas | The host origin of the dropped image URL | HTTP GET request to download image bytes for local ingestion | Initiated directly by user drag-and-drop gesture. Falls back gracefully to a link bookmark card if CORS blocks the request. |

## Network Principles

1. **No PaperTab Servers**: PaperTab has zero proprietary cloud infrastructure. No boards, drawings, notes, or uploaded images are ever sent to PaperTab.
2. **No Analytics or Telemetry**: No tracking scripts, analytics SDKs, session recording, or pingbacks exist anywhere in the codebase.
3. **Opt-in Optional Permissions**: Broad web access (`https://*/*`) is defined under `optional_host_permissions` in Chrome MV3. It is not requested on install; it is only prompted if the user opts in, and can be revoked at any time in Settings.
