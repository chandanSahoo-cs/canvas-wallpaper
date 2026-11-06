import { newId } from "../utils";
import {
  InboxItem,
  InboxItemState,
  INBOX_HINT_KEY,
  INBOX_STORAGE_KEY,
  INBOX_TICK_KEY,
} from "./types";

let fallbackChain: Promise<any> = Promise.resolve();

export async function withInboxLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("papertab-inbox", fn);
  }
  const next = fallbackChain.catch(() => {}).then(fn);
  fallbackChain = next.catch(() => {});
  return next;
}

export async function getInboxItemsOrThrow(): Promise<InboxItem[]> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([INBOX_STORAGE_KEY], (res) => {
        if (chrome.runtime?.lastError) {
          return reject(
            new Error(
              chrome.runtime.lastError.message ||
                String(chrome.runtime.lastError),
            ),
          );
        }
        const items = res?.[INBOX_STORAGE_KEY];
        resolve(Array.isArray(items) ? items : []);
      });
    });
  }

  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(INBOX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  }
  return [];
}

export async function getInboxItems(): Promise<InboxItem[]> {
  try {
    return await getInboxItemsOrThrow();
  } catch (err) {
    console.warn("Failed to load inbox items:", err);
    return [];
  }
}

export async function updateBadgeCount(unreadCount?: number): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.action?.setBadgeText) return;

  try {
    let count = unreadCount;
    if (count === undefined) {
      const items = await getInboxItems();
      count = items.filter((it) => it.state === "new").length;
    }

    const badgeText = count > 0 ? (count > 99 ? "99+" : String(count)) : "";
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: "#00BF63" });
    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({ color: "#FFFFFF" });
    }
  } catch {}
}

export async function saveInboxItems(items: InboxItem[]): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set(
          {
            [INBOX_STORAGE_KEY]: items,
            [INBOX_TICK_KEY]: Date.now(),
          },
          () => {
            if (chrome.runtime?.lastError) {
              return reject(
                new Error(
                  chrome.runtime.lastError.message ||
                    String(chrome.runtime.lastError),
                ),
              );
            }
            resolve();
          },
        );
      });
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(INBOX_TICK_KEY, String(Date.now()));
    }

    const unread = items.filter((it) => it.state === "new").length;
    await updateBadgeCount(unread);

    // Notify any active views via runtime messaging
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: "INBOX_UPDATED" }, () => {
          // Ignore error when no active receivers are listening
          if (chrome.runtime.lastError) {}
        });
      } catch {}
    }
  } catch (err) {
    console.warn("Failed to save inbox items:", err);
    throw err;
  }
}

export async function addInboxItem(
  partial: Omit<InboxItem, "id" | "createdAt" | "state"> &
    Partial<Pick<InboxItem, "id" | "createdAt" | "state">>,
): Promise<InboxItem> {
  return withInboxLock(async () => {
    const current = await getInboxItems();
    const newItem: InboxItem = {
      id: partial.id || newId(),
      createdAt: partial.createdAt || Date.now(),
      state: partial.state || "new",
      kind: partial.kind,
      assetId: partial.assetId,
      url: partial.url,
      title: partial.title,
      text: partial.text,
      faviconUrl: partial.faviconUrl,
      source: partial.source || { savedAt: Date.now() },
      fallbackReason: partial.fallbackReason,
    };

    const updated = [newItem, ...current];
    await saveInboxItems(updated);
    return newItem;
  });
}

export async function updateInboxItemState(
  id: string,
  state: InboxItemState,
): Promise<void> {
  return withInboxLock(async () => {
    const current = await getInboxItems();
    const updated = current.map((it) => (it.id === id ? { ...it, state } : it));
    await saveInboxItems(updated);
  });
}

export async function dismissInboxItem(id: string): Promise<void> {
  await updateInboxItemState(id, "dismissed");
}

export async function undoDismissInboxItem(id: string): Promise<void> {
  await updateInboxItemState(id, "new");
}

export async function deleteInboxItem(id: string): Promise<void> {
  return withInboxLock(async () => {
    const current = await getInboxItems();
    const updated = current.filter((it) => it.id !== id);
    await saveInboxItems(updated);
  });
}

export async function clearAllDismissed(): Promise<void> {
  return withInboxLock(async () => {
    const current = await getInboxItems();
    const updated = current.filter((it) => it.state !== "dismissed");
    await saveInboxItems(updated);
  });
}

export async function getInboxCaptureHint(): Promise<boolean> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([INBOX_HINT_KEY], (res) => {
          resolve(Boolean(res?.[INBOX_HINT_KEY]));
        });
      });
    }
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(INBOX_HINT_KEY) === "true";
    }
  } catch {}
  return false;
}

export async function setInboxCaptureHint(seen: boolean): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [INBOX_HINT_KEY]: seen });
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(INBOX_HINT_KEY, String(seen));
    }
  } catch {}
}
