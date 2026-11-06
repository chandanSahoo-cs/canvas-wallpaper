# Privacy Policy for PaperTab

**Last updated:** November 5, 2026

PaperTab is committed to respecting and protecting your privacy. This browser extension is designed from the ground up to be private, local-first, and honest about how it works.

---

### 1. Data Collection & Storage

- **No Accounts, No Tracking, No Telemetry:** PaperTab has no user accounts, no analytics, no tracking scripts, and no PaperTab backend servers. We do not collect, harvest, track, or sell your personal information or browsing history.
- **On-Device Storage Only:** Your drawings, boards, background preferences, widget layout coordinates, quick links, and Inbox items are stored directly on your device using the browser's `chrome.storage.local` API.
- **Local IndexedDB Asset Store:** High-resolution images, thumbnails, and visual assets you import, capture, or paste onto the board are stored in your browser's local `IndexedDB` (`papertab_assets`). Your boards, drawings, notes, and visual assets are stored on your device and are never uploaded to PaperTab or anyone else.
- **No Cookies or Tracking:** The extension does not set or track HTTP cookies or advertising identifiers.

---

### 2. Outbound Network Requests

PaperTab has no proprietary servers and does not send your data to PaperTab. It does make certain outbound requests, listed honestly:

1. **Quick Links Favicons:** To display site icons in the Quick Links shortcut tiles, domains are requested from Google's favicon service (`https://www.google.com/s2/favicons`). This request reveals the linked site's domain to Google. No user identifiers or personal data are attached.
2. **Search Engine Queries:** When you submit a search query through the search bar widget, your browser navigates to your chosen search engine (Google, DuckDuckGo, Bing, or Brave Search), transmitting the query you entered.
3. **Web Capture & Link Previews:** When you choose to save an image, link, selection, or page from the web (or enrich link cards with previews and favicons), the extension fetches the content directly from the original website. This uses the optional host permission (`https://*/*`) that is requested only on opt-in and can be revoked at any time in Settings.

For an exhaustive audit of every network request, see [docs/NETWORK-REQUESTS.md](docs/NETWORK-REQUESTS.md).

---

### 3. Extension Permissions

- **`storage` & `unlimitedStorage`:** Used exclusively to store your drawings, wallpaper scenes, widget configurations, Inbox captures, and IndexedDB assets locally on your machine so they persist reliably without arbitrary size quota limitations.
- **`contextMenus`:** Adds right-click menu options allowing you to save images, links, text snippets, and pages directly to your local PaperTab Inbox.
- **`optional_host_permissions (https://*/*)`:** Requested only on explicit opt-in if you choose to enable saving images and link metadata from across the web. You can revoke this permission at any time in Settings.

---

### 4. Payments & Subscriptions

PaperTab is free to use with no hidden charges, subscriptions, or paywalls. If optional premium features are introduced in the future, transactions will be processed through standard, secure payment processors. We do not store or process payment card details.

---

### 5. Contact & Support

If you have any questions or feedback regarding this Privacy Policy or PaperTab, please reach out via the official Chrome Web Store listing support tab.
