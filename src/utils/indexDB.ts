import { encryptSensitiveFields, decryptSensitiveFields } from './encryption';

const DB_NAME = 'AnalyticsDB';
const DB_VERSION = 1;
const PRUNE_INTERVAL = 60 * 60 * 1000; // 1 hour

const SENSITIVE_FIELDS = ['siteName', 'siteId'];

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

// ✅ Save with transaction-safe logic
export const saveToIndexedDB = async (storeName: string, data: any[]): Promise<void> => {
  if (typeof window === 'undefined') return;

  const db = await initDB();

  const processedData = await Promise.all(
    data.map(async (item) => {
      const encryptedItem = await encryptSensitiveFields(item);
      if (storeName === 'analytics_data' && !encryptedItem.id) {
        encryptedItem.id = generateUniqueId(item);
      }
      return encryptedItem;
    })
  );

  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  processedData.forEach((item) => {
    const addRequest = store.add(item);
    addRequest.onerror = () => {
      if (addRequest.error?.name === 'ConstraintError') {
        const putRequest = store.put(item);
        putRequest.onerror = () => console.warn('Put failed:', putRequest.error);
      } else {
        console.warn('Add failed:', addRequest.error);
      }
    };
  });

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));
  });

  db.close();
};

export const saveToIndexedDBUpsert = async (storeName: string, data: any[]): Promise<void> => {
  if (typeof window === 'undefined') return;

  const db = await initDB();

  const processedData = await Promise.all(
    data.map(async (item) => {
      const encryptedItem = await encryptSensitiveFields(item);
      if (storeName === 'analytics_data' && !encryptedItem.id) {
        encryptedItem.id = generateUniqueId(item);
      }
      return encryptedItem;
    })
  );

  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  processedData.forEach((item) => {
    const putRequest = store.put(item);
    putRequest.onerror = () => console.warn('Put error:', putRequest.error);
  });

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
};

export const appendToIndexedDB = async (storeName: string, newItem: any): Promise<void> => {
  if (typeof window === 'undefined') return;

  const db = await initDB();
  const encryptedItem = await encryptSensitiveFields(newItem);

  if (storeName === 'analytics_data' && !encryptedItem.id) {
    encryptedItem.id = generateUniqueId(newItem);
  }

  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  store.put(encryptedItem).onerror = (event) => {
    console.error('Append put error:', (event.target as IDBRequest).error);
  };

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
};

export const loadFromIndexedDB = async (storeName: string): Promise<any[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const data = await new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return Promise.all(data.map(decryptSensitiveFields));
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return [];
  }
};

export const pruneOldData = async (storeName: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const db = await initDB();
    const cutoffTime = new Date(Date.now() - PRUNE_INTERVAL).toISOString();

    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Store ${storeName} does not exist`);
      db.close();
      return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    if (storeName === 'analytics_data') {
      if (!store.indexNames.contains('timestamp')) {
        console.warn(`Missing timestamp index in ${storeName}`);
        db.close();
        return;
      }

      const index = store.index('timestamp');
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    } else if (storeName === 'analytics_sites') {
      await new Promise<void>((resolve, reject) => {
        const request = store.openCursor();

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const siteData = cursor.value;
            if (Array.isArray(siteData.data)) {
              const filteredData = siteData.data.filter((item: any) => item.timestamp > cutoffTime);
              if (filteredData.length !== siteData.data.length) {
                cursor.update({ ...siteData, data: filteredData });
              }
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error('Error pruning old data:', error);
  }
};
