import { decryptSensitiveFields, encryptSensitiveFields } from "./encryption";

const DB_NAME = 'analytics_db';
const DB_VERSION = 1;
const DATA_STORE = 'analytics_data';
const SITES_STORE = 'analytics_sites';
const DATA_EXPIRY_HOURS = 1




// IndexedDB helper functions
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        const dataStore = db.createObjectStore(DATA_STORE, { keyPath: 'id', autoIncrement: true });
        dataStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(SITES_STORE)) {
        const sitesStore = db.createObjectStore(SITES_STORE, { keyPath: 'siteId' });
        sitesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

export const saveToIndexedDB = async (storeName: string, data: any): Promise<void> => {
  try {
    // Pre-process all encryption outside of the transaction
    const timestamp = Date.now();
    let processedData;

    if (Array.isArray(data)) {
      // Encrypt all items before opening transaction
      processedData = await Promise.all(
        data.map(async (item) => {
          const encryptedItem = await encryptSensitiveFields(item);
          return { ...encryptedItem, timestamp };
        })
      );
    } else {
      // Encrypt single item before opening transaction
      const encryptedData = await encryptSensitiveFields(data);
      processedData = { ...encryptedData, timestamp };
    }

    // Now open transaction and perform synchronous operations only
    const db = await openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data
    await store.clear();

    // Add processed data synchronously
    if (Array.isArray(processedData)) {
      for (const item of processedData) {
        store.add(item); // No await here - let them queue up
      }
    } else {
      store.add(processedData);
    }

    // Wait for transaction to complete
    await transaction.oncomplete;
    
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error; // Re-throw to allow caller to handle
  }
};

// Alternative approach using a single bulk operation (more efficient)
export const saveToIndexedDBBulk = async (storeName: string, data: any): Promise<void> => {
  try {
    const timestamp = Date.now();
    let processedData;

    // Pre-process encryption
    if (Array.isArray(data)) {
      processedData = await Promise.all(
        data.map(async (item) => {
          const encryptedItem = await encryptSensitiveFields(item);
          return { ...encryptedItem, timestamp };
        })
      );
    } else {
      const encryptedData = await encryptSensitiveFields(data);
      processedData = [{ ...encryptedData, timestamp }];
    }

    const db = await openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear and add in one go
    await store.clear();
    
    // Add all items without awaiting individual operations
    processedData.forEach(item => store.add(item));
    
    // Wait for transaction completion
    await transaction.oncomplete;
    
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
};

export const loadFromIndexedDB = async (storeName: string): Promise<any[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([storeName], 'readwrite'); // Use readwrite to allow pruning
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        const data = request.result || [];
        
        // Prune expired data (older than 1 hour)
        const cutoffTime = Date.now() - (DATA_EXPIRY_HOURS * 60 * 60 * 1000);
        const validData = data.filter((item: any) => 
          item.timestamp && item.timestamp > cutoffTime
        );
        
        // Remove expired data from IndexedDB
        if (validData.length < data.length) {
          const expiredData = data.filter((item: any) => 
            item.timestamp && item.timestamp <= cutoffTime
          );
          
          for (const expiredItem of expiredData) {
            if (storeName === DATA_STORE) {
              await store.delete(expiredItem.id);
            } else {
              await store.delete(expiredItem.siteId);
            }
          }
          
          console.log(`Pruned ${data.length - validData.length} expired records from ${storeName}`);
        }
        
        // Decrypt sensitive fields and remove timestamp from returned data
        const cleanData = await Promise.all(
          validData.map(async ({ timestamp, ...item }) => {
            const decryptedItem = await decryptSensitiveFields(item);
            return decryptedItem;
          })
        );
        
        resolve(cleanData);
      };
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return [];
  }
};