import { decryptSensitiveFields, encryptSensitiveFields } from "./encryption";


const DB_NAME = 'AnalyticsDB';
const DB_VERSION = 1;
const PRUNE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds




// IndexedDB utility functions for caching analytics data

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('analytics_data')) {
        const dataStore = db.createObjectStore('analytics_data', { keyPath: 'timestamp' });
        dataStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('analytics_sites')) {
        const sitesStore = db.createObjectStore('analytics_sites', { keyPath: 'siteId' });
        sitesStore.createIndex('siteId', 'siteId', { unique: false });
      }
    };
  });
};

// Save data to IndexedDB
export const saveToIndexedDB = async (storeName: string, data: any[]): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add new data
    for (const item of data) {
      await new Promise<void>((resolve, reject) => {
        const addRequest = store.add(item);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    }

    db.close();
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
  }
};

// Load data from IndexedDB
export const loadFromIndexedDB = async (storeName: string): Promise<any[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const data = request.result || [];
        db.close();
        resolve(data);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return [];
  }
};

// Prune old data (older than 1 hour)
export const pruneOldData = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const db = await initDB();
    const cutoffTime = new Date(Date.now() - PRUNE_INTERVAL).toISOString();

    const transaction = db.transaction(['analytics_data'], 'readwrite');
    const store = transaction.objectStore('analytics_data');
    const index = store.index('timestamp');

    const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        db.close();
      }
    };

    request.onerror = () => {
      db.close();
      console.error('Error pruning old data:', request.error);
    };
  } catch (error) {
    console.error('Error pruning old data:', error);
  }
};

// Set up automatic pruning every 15 minutes
if (typeof window !== 'undefined') {
  setInterval(pruneOldData, 15 * 60 * 1000); // 15 minutes
}