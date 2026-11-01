export type InboxItemKind = "image" | "link" | "text";
export type InboxItemState = "new" | "placed" | "dismissed";

export interface InboxSource {
  url?: string;
  title?: string;
  savedAt: number;
}

export interface InboxItem {
  id: string;
  kind: InboxItemKind;
  assetId?: string;
  url?: string;
  title?: string;
  text?: string;
  faviconUrl?: string;
  source: InboxSource;
  createdAt: number;
  state: InboxItemState;
  fallbackReason?: "cors_blocked" | "fetch_failed" | "unsupported_type";
}

export const INBOX_STORAGE_KEY = "papertab_inbox_items";
export const INBOX_HINT_KEY = "papertab_inbox_capture_hint";
export const INBOX_TICK_KEY = "papertab_inbox_tick";

export const MAX_TEXT_LENGTH = 5000;
export const MAX_TITLE_LENGTH = 250;
export const MAX_URL_LENGTH = 2048;
export const MAX_IMAGE_FETCH_BYTES = 25 * 1024 * 1024; // 25 MB cap
export const FETCH_TIMEOUT_MS = 15_000; // 15 seconds
