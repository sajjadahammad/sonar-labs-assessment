// indexDBWorker.ts

import { encryptSensitiveFields, decryptSensitiveFields } from "@/utils/encryption";

const DB_NAME = 'AnalyticsDB';
const DB_VERSION = 1;
const PRUNE_INTERVAL = 60 * 60 * 1000;



const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('analytics_data')) {
        const dataStore = db.createObjectStore('analytics_data', { keyPath: 'id' });
        dataStore.createIndex('timestamp', 'timestamp', { unique: false });
        dataStore.createIndex('siteId', 'siteId', { unique: false });
      }
      if (!db.objectStoreNames.contains('analytics_sites')) {
        const sitesStore = db.createObjectStore('analytics_sites', { keyPath: 'siteId' });
        sitesStore.createIndex('siteId', 'siteId', { unique: true });
      }
    };
  });
};

const generateUniqueId = (item: any): string => {
  return `${item.siteId}_${item.timestamp}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const handlers = {
  async save({ storeName, data }: any) {
    const db = await initDB();
    const processedData = await Promise.all(
      data.map(async (item: any) => {
        const encryptedItem = await encryptSensitiveFields(item);
        if (storeName === 'analytics_data' && !encryptedItem.id) {
          encryptedItem.id = generateUniqueId(item);
        }
        return encryptedItem;
      })
    );
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    processedData.forEach((item) => store.put(item));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    db.close();
    return true;
  },

  async append({ storeName, newItem }: any) {
    const db = await initDB();
    const item = await encryptSensitiveFields(newItem);
    if (storeName === 'analytics_data' && !item.id) {
      item.id = generateUniqueId(newItem);
    }
    const tx = db.transaction([storeName], 'readwrite');
    tx.objectStore(storeName).put(item);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    db.close();
    return true;
  },

  async load({ storeName }: any) {
    const db = await initDB();
    const tx = db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const data: any[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return Promise.all(data.map(decryptSensitiveFields));
  },

  async prune({ storeName }: any) {
    const db = await initDB();
    const cutoffTime = new Date(Date.now() - PRUNE_INTERVAL).toISOString();
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);

    if (storeName === 'analytics_data') {
      // Iterate over all records with timestamp <= cutoffTime and delete them
      await new Promise<void>((resolve, reject) => {
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoffTime, true);
        const req = index.openCursor(range);
        req.onerror = () => reject(req.error);
        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    } else if (storeName === 'analytics_sites') {
      // For each site, filter its data array to only keep recent entries
      await new Promise<void>((resolve, reject) => {
        const req = store.openCursor();
        req.onerror = () => reject(req.error);
        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const site = cursor.value;
            if (Array.isArray(site.data)) {
              const filtered = site.data.filter((d: any) => d.timestamp > cutoffTime);
              if (filtered.length !== site.data.length) {
                cursor.update({ ...site, data: filtered });
              }
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    db.close();
    return true;
  },
};

self.onmessage = async (e) => {
  const { action, payload, id } = e.data;
  if (handlers[action as keyof typeof handlers]) {
    try {
      // @ts-ignore
      const result = await handlers[action as keyof typeof handlers](payload);
      self.postMessage({ id, result });
    } catch (error: any) {
      self.postMessage({ id, error: error?.message || String(error) });
    }
  } else {
    self.postMessage({ id, error: 'Unknown action' });
  }
};
