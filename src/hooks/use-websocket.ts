'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import useWebSocketLib, { ReadyState } from 'react-use-websocket';
import type { AnalyticsData } from '@/types/analytics';
import { createMockDataStream } from '@/utils/mockDataGenerator';

// Define a type for site data with analytics history
type SiteWithAnalytics = {
  siteId: string;
  siteName: string;
  data: AnalyticsData[];
};

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// Data management constants
const MAX_DATA_POINTS = 1000;
const MAX_SITE_DATA_POINTS = 100;
const DB_NAME = 'analytics_db';
const DB_VERSION = 1;
const DATA_STORE = 'analytics_data';
const SITES_STORE = 'analytics_sites';
const DATA_EXPIRY_HOURS = 1; // Data expires after 1 hour

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

const saveToIndexedDB = async (storeName: string, data: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Clear existing data and add new data with timestamp
    await store.clear();
    const timestamp = Date.now();
    
    if (Array.isArray(data)) {
      for (const item of data) {
        await store.add({ ...item, timestamp });
      }
    } else {
      await store.add({ ...data, timestamp });
    }
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
  }
};

const loadFromIndexedDB = async (storeName: string): Promise<any[]> => {
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
        
        // Remove timestamp from returned data to maintain compatibility
        const cleanData = validData.map(({ timestamp, ...item }) => item);
        resolve(cleanData);
      };
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return [];
  }
};

// Custom hook for WebSocket management
export function useWebSocket() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [sites, setSites] = useState<SiteWithAnalytics[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Initialize data from IndexedDB
  useEffect(() => {
    const initializeData = async () => {
      if (typeof window !== 'undefined') {
        const [cachedData, cachedSites] = await Promise.all([
          loadFromIndexedDB(DATA_STORE),
          loadFromIndexedDB(SITES_STORE)
        ]);
        
        if (cachedData.length > 0) {
          setData(cachedData);
        }
        if (cachedSites.length > 0) {
          setSites(cachedSites);
        }
      }
    };
    
    initializeData();
  }, []);

  // Cache data to IndexedDB
  const cacheData = useCallback(async (newData: AnalyticsData[], newSites: SiteWithAnalytics[]) => {
    if (typeof window !== 'undefined') {
      try {
        await Promise.all([
          saveToIndexedDB(DATA_STORE, newData),
          saveToIndexedDB(SITES_STORE, newSites)
        ]);
      } catch (error) {
        console.error('Error caching data:', error);
      }
    }
  }, []);

  // Prune data to maintain performance
  const pruneData = useCallback((dataArray: AnalyticsData[], maxPoints: number) => {
    if (dataArray.length <= maxPoints) return dataArray;
    
    // Keep the most recent data points
    return dataArray.slice(-maxPoints);
  }, []);

  // WebSocket connection using react-use-websocket with reconnection logic
  const { lastMessage, readyState } = useWebSocketLib('ws://localhost:8080', {
    shouldReconnect: () => true,
    reconnectAttempts: 3,
    reconnectInterval: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000),
    onError: () => {
      setConnectionStatus('error');
      setError('WebSocket connection failed');
    },
  });

  // Update connection status based on readyState
  useEffect(() => {
    switch (readyState) {
      case ReadyState.CONNECTING:
        setConnectionStatus('connecting');
        setError(null);
        break;
      case ReadyState.OPEN:
        setConnectionStatus('connected');
        setError(null);
        setUsingMockData(false);
        break;
      case ReadyState.CLOSING:
      case ReadyState.CLOSED:
        setConnectionStatus('disconnected');
        break;
      default:
        setConnectionStatus('disconnected');
    }
  }, [readyState]);

  // Handle incoming WebSocket messages and update state
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | undefined;
    if (lastMessage && readyState === ReadyState.OPEN) {
      try {
        const newData: AnalyticsData = JSON.parse(lastMessage.data);
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(async () => {
          setData((prevData) => {
            const updatedData = pruneData([...prevData, newData], MAX_DATA_POINTS);
            return updatedData;
          });
          
          setSites((prevSites) => {
            const existingSiteIndex = prevSites.findIndex((s) => s.siteId === newData.siteId);
            let updatedSites: SiteWithAnalytics[];
            
            if (existingSiteIndex === -1) {
              updatedSites = [...prevSites, { 
                siteId: newData.siteId, 
                siteName: newData.siteName, 
                data: [newData] 
              }];
            } else {
              updatedSites = prevSites.map((site, index) =>
                index === existingSiteIndex 
                  ? { 
                      ...site, 
                      data: pruneData([...site.data, newData], MAX_SITE_DATA_POINTS) 
                    } 
                  : site
              );
            }
            
            // Cache the updated data asynchronously
            setData((currentData) => {
              cacheData(currentData, updatedSites);
              return currentData;
            });
            
            return updatedSites;
          });
        }, 100);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Failed to parse WebSocket data');
      }
    }
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [lastMessage, readyState, pruneData, cacheData]);

  // Start mock data stream as a fallback
  const startMockDataStream = useCallback(() => {
    setUsingMockData(true);
    setConnectionStatus('connected');
    setError('Using demo data - WebSocket server not available');

    const handleMockData = (mockData: AnalyticsData) => {
      setData((prevData) => {
        const updatedData = pruneData([...prevData, mockData], MAX_DATA_POINTS);
        return updatedData;
      });
      
      setSites((prevSites) => {
        const existingSiteIndex = prevSites.findIndex((s) => s.siteId === mockData.siteId);
        let updatedSites: SiteWithAnalytics[];
        
        if (existingSiteIndex === -1) {
          updatedSites = [...prevSites, {
            siteId: mockData.siteId,
            siteName: mockData.siteName,
            data: [mockData],
          }];
        } else {
          updatedSites = prevSites.map((site, index) =>
            index === existingSiteIndex
              ? { 
                  ...site, 
                  data: pruneData([...site.data, mockData], MAX_SITE_DATA_POINTS) 
                }
              : site
          );
        }
        
        // Cache the updated data asynchronously
        setData((currentData) => {
          cacheData(currentData, updatedSites);
          return currentData;
        });
        
        return updatedSites;
      });
    };

    const cleanup = createMockDataStream(handleMockData);
    return cleanup;
  }, [pruneData, cacheData]);

  // Manage mock data fallback and cleanup
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (readyState !== ReadyState.OPEN && !usingMockData) {
      console.log('Starting mock data stream - WebSocket not connected');
      cleanup = startMockDataStream();
    } else if (readyState === ReadyState.OPEN && usingMockData && cleanup) {
      cleanup();
      setUsingMockData(false);
    }

    return () => {
      if (cleanup) {
        console.log('Cleaning up mock data stream');
        cleanup();
      }
    };
  }, [readyState, usingMockData, startMockDataStream]);

  // Memoized loading state
  const isLoading = useMemo(() => 
    data.length === 0 && connectionStatus !== 'connected', 
    [data.length, connectionStatus]
  );

  return {
    data,
    sites,
    connectionStatus,
    error,
    usingMockData,
    isLoading,
  };
}