/**
 * Manages runtime optional host permissions for PaperTab capture.
 *
 * Requirements:
 * - Install-time: contextMenus, storage, unlimitedStorage.
 * - Optional runtime: https://* /* requested on-demand by user gesture.
 * - Fully local-first: items only fetched on explicit user action.
 */

export const HOST_PERMISSION_ORIGINS = ["https://*/*"];

export const HOST_PERMISSIONS: chrome.permissions.Permissions = {
  origins: HOST_PERMISSION_ORIGINS,
};

export async function hasHostPermission(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions?.contains) {
    return false;
  }
  return new Promise((resolve) => {
    chrome.permissions.contains(HOST_PERMISSIONS, (result) => {
      resolve(Boolean(result));
    });
  });
}

export async function requestHostPermission(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions?.request) {
    return false;
  }
  return new Promise((resolve) => {
    chrome.permissions.request(HOST_PERMISSIONS, (granted) => {
      resolve(Boolean(granted));
    });
  });
}

export async function removeHostPermission(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.permissions?.remove) {
    return false;
  }
  return new Promise((resolve) => {
    chrome.permissions.remove(HOST_PERMISSIONS, (removed) => {
      resolve(Boolean(removed));
    });
  });
}

export function subscribeHostPermission(callback: (granted: boolean) => void): () => void {
  if (typeof chrome === "undefined" || !chrome.permissions) {
    return () => {};
  }

  const check = () => {
    hasHostPermission().then(callback);
  };

  const onAdded = (permissions: chrome.permissions.Permissions) => {
    if (permissions.origins?.some((o) => o.includes("https://*/*") || o.includes("<all_urls>"))) {
      callback(true);
    } else {
      check();
    }
  };

  const onRemoved = (permissions: chrome.permissions.Permissions) => {
    if (permissions.origins?.some((o) => o.includes("https://*/*") || o.includes("<all_urls>"))) {
      callback(false);
    } else {
      check();
    }
  };

  chrome.permissions.onAdded?.addListener(onAdded);
  chrome.permissions.onRemoved?.addListener(onRemoved);

  // Initial check
  check();

  return () => {
    chrome.permissions.onAdded?.removeListener(onAdded);
    chrome.permissions.onRemoved?.removeListener(onRemoved);
  };
}
