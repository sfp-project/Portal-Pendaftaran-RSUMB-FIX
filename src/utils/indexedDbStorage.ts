/**
 * Lightweight IndexedDB wrapper for durable local storage of rich objects
 * (e.g. Inpatient Room catalogs with uploaded photos) without localStorage 5MB quota limits.
 */

const DB_NAME = 'rsumb_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_key_values';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (e) => {
          console.warn('IndexedDB open error:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB not supported or permission denied:', err);
        resolve(null);
      }
    });
  }

  return dbPromise;
}

export async function getIdbItem<T>(key: string): Promise<T | null> {
  try {
    const db = await getDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve((request.result as T) ?? null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function setIdbItem<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function deleteIdbItem(key: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
