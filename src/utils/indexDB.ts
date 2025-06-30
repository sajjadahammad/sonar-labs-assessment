import { encryptSensitiveFields, decryptSensitiveFields } from './encryption';

const DB_NAME = 'AnalyticsDB';
const DB_VERSION = 1;
const PRUNE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('analytics_data')) {
        const dataStore = db.createObjectStore('analytics_data', { keyPath: 'id' }); // Use 'id' instead of 'timestamp'
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

// Generate unique ID for analytics data
const generateUniqueId = (item: any): string => {
  return `${item.siteId}_${item.timestamp}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Save data to IndexedDB with encryption for sensitive fields
export const saveToIndexedDB = async (storeName: string, data: any[]): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const db = await initDB();
    
    // Pre-process data to ensure unique keys and encrypt sensitive fields
    const processedData = await Promise.all(
      data.map(async (item) => {
        const encryptedItem = await encryptSensitiveFields(item);
        
        // Ensure unique ID for analytics_data store
        if (storeName === 'analytics_data' && !encryptedItem.id) {
          encryptedItem.id = generateUniqueId(item);
        }
        
        return encryptedItem;
      })
    );

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data first
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add data one by one to handle potential duplicates
    for (const item of processedData) {
      try {
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add(item);
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => {
            // If constraint violation, try to update instead
            if (addRequest.error?.name === 'ConstraintError') {
              const putRequest = store.put(item);
              putRequest.onsuccess = () => resolve();
              putRequest.onerror = () => reject(putRequest.error);
            } else {
              reject(addRequest.error);
            }
          };
        });
      } catch (error) {
        console.warn(`Failed to save item:`, item, error);
        // Continue with other items even if one fails
      }
    }

    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });

    db.close();
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
};

// Alternative method using put instead of add (overwrites duplicates)
export const saveToIndexedDBUpsert = async (storeName: string, data: any[]): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const db = await initDB();
    
    // Pre-process data
    const processedData = await Promise.all(
      data.map(async (item) => {
        const encryptedItem = await encryptSensitiveFields(item);
        
        // Ensure unique ID for analytics_data store
        if (storeName === 'analytics_data' && !encryptedItem.id) {
          encryptedItem.id = generateUniqueId(item);
        }
        
        return encryptedItem;
      })
    );

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data first
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Use put instead of add to handle duplicates
    const putPromises = processedData.map(item => 
      new Promise<void>((resolve, reject) => {
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      })
    );

    await Promise.all(putPromises);

    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });

    db.close();
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
};

// Append new data without clearing existing data
export const appendToIndexedDB = async (storeName: string, newItem: any): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const db = await initDB();
    const encryptedItem = await encryptSensitiveFields(newItem);
    
    // Ensure unique ID for analytics_data store
    if (storeName === 'analytics_data' && !encryptedItem.id) {
      encryptedItem.id = generateUniqueId(newItem);
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(encryptedItem); // Use put to handle potential duplicates
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error('Error appending to IndexedDB:', error);
    throw error;
  }
};

// Load data from IndexedDB with decryption for sensitive fields
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
    
    // Decrypt sensitive fields
    return Promise.all(data.map(async (item) => await decryptSensitiveFields(item)));
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return [];
  }
};

// Prune old data (older than 1 hour)
export const pruneOldData = async (storeName: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const db = await initDB();
    const cutoffTime = new Date(Date.now() - PRUNE_INTERVAL).toISOString();

    // Check if the store exists
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Store ${storeName} does not exist, skipping pruning`);
      db.close();
      return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Handle different store structures
    if (storeName === 'analytics_data') {
      // For analytics_data store, use timestamp index
      if (!store.indexNames.contains('timestamp')) {
        console.warn(`Store ${storeName} does not have timestamp index, skipping pruning`);
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
      // For analytics_sites store, iterate through all records and check nested data timestamps
      await new Promise<void>((resolve, reject) => {
        const request = store.openCursor();

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const siteData = cursor.value;
            
            // Filter out old data from the nested data array
            if (siteData.data && Array.isArray(siteData.data)) {
              const filteredData = siteData.data.filter((item: any) => {
                return item.timestamp && item.timestamp > cutoffTime;
              });
              
              // Update the record with filtered data
              if (filteredData.length !== siteData.data.length) {
                const updatedSiteData = { ...siteData, data: filteredData };
                cursor.update(updatedSiteData);
              }
            }
            
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    } else {
      console.warn(`Unknown store ${storeName}, skipping pruning`);
      db.close();
      return;
    }

    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
  } catch (error) {
    console.error('Error pruning old data:', error);
  }
};