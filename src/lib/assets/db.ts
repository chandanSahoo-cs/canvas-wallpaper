import { StoredAsset } from "./types";

const DB_NAME = "papertab_assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

export function openAssetDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by_hash", "hash", { unique: false });
        store.createIndex("by_createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => {
        dbInstance = null;
        dbOpenPromise = null;
      };
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbOpenPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      dbOpenPromise = null;
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });

  return dbOpenPromise;
}

export async function saveAsset(asset: StoredAsset): Promise<void> {
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(asset);

      req.onsuccess = () => resolve();
      req.onerror = () => {
        if (req.error?.name === "QuotaExceededError") {
          reject(new Error("Storage quota exceeded. Please free up disk space."));
        } else {
          reject(req.error || new Error("Failed to save asset"));
        }
      };
      tx.onabort = () => {
        reject(tx.error || new Error("Transaction aborted"));
      };
    } catch (err) {
      reject(err);
    }
  });
}

export async function getAsset(id: string): Promise<StoredAsset | null> {
  if (!id) return null;
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as StoredAsset) || null);
      req.onerror = () => reject(req.error || new Error("Failed to get asset"));
    } catch (err) {
      reject(err);
    }
  });
}

export async function getAssetByHash(hash: string): Promise<StoredAsset | null> {
  if (!hash) return null;
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("by_hash");
      const req = index.get(hash);

      req.onsuccess = () => resolve((req.result as StoredAsset) || null);
      req.onerror = () => reject(req.error || new Error("Failed to query asset by hash"));
    } catch (err) {
      reject(err);
    }
  });
}

export async function getAllAssets(): Promise<StoredAsset[]> {
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as StoredAsset[]) || []);
      req.onerror = () => reject(req.error || new Error("Failed to retrieve assets"));
    } catch (err) {
      reject(err);
    }
  });
}

export async function deleteAsset(id: string): Promise<void> {
  if (!id) return;
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to delete asset"));
    } catch (err) {
      reject(err);
    }
  });
}

export async function clearAllAssets(): Promise<void> {
  const db = await openAssetDb();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to clear assets"));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Best-effort request for persistent storage permission so browser
 * eviction heuristics do not unexpectedly drop stored user images.
 */
export async function requestStoragePersistence(): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {}
  return false;
}
