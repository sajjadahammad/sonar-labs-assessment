'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useWebSocketLib, { ReadyState } from 'react-use-websocket';
import { createMockDataStream } from '@/utils/mockDataGenerator';
import { loadFromIndexedDB, pruneOldData, saveToIndexedDB } from '@/utils/indexDB';
import { SiteAnalyticsData } from '@/types/socket';

// Define a type for site data with analytics history
type SiteWithAnalytics = {
  siteId: string;
  siteName: string;
  data: SiteAnalyticsData[];
};

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// Data management constants
const MAX_DATA_POINTS = 1000;
const MAX_SITE_DATA_POINTS = 100;
const DATA_STORE = 'analytics_data';
const SITES_STORE = 'analytics_sites';

// Custom hook for WebSocket management
export function useWebSocketInternal() {
  const [data, setData] = useState<SiteAnalyticsData[]>([]);
  const [sites, setSites] = useState<SiteWithAnalytics[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [indexedDBTimeout, setIndexedDBTimeout] = useState(false);
  const mockCleanupRef = useRef<() => void | null>(null);

  // Prune data to maintain performance
  const pruneData = useCallback((dataArray: SiteAnalyticsData[], maxPoints: number) => {
    if (dataArray.length <= maxPoints) return dataArray;
    // Keep the most recent data points
    return dataArray.slice(-maxPoints);
  }, []);

  // Cache data to IndexedDB
  const cacheData = useCallback(async (newData: SiteAnalyticsData[], newSites: SiteWithAnalytics[]) => {
    if (typeof window !== 'undefined') {
      try {
        await Promise.all([
          saveToIndexedDB(DATA_STORE, newData),
          saveToIndexedDB(SITES_STORE, newSites),
        ]);
      } catch (error) {
        console.error('Error caching data:', error);
      }
    }
  }, []);

  // Start mock data stream as a fallback
  const startMockDataStream = useCallback(() => {
    if (mockCleanupRef.current) {
      mockCleanupRef.current(); // cleanup previous
    }
    setUsingMockData(true);
    setConnectionStatus('connected');
    setError('Using demo data - WebSocket server not available');

    const handleMockData = (mockData: SiteAnalyticsData) => {
      setData((prevData) => {
        const updatedData = pruneData([...prevData, mockData], MAX_DATA_POINTS);
        return updatedData;
      });

      setSites((prevSites) => {
        const existingSiteIndex = prevSites.findIndex((s) => s.siteId === mockData.siteId);
        let updatedSites: SiteWithAnalytics[];

        if (existingSiteIndex === -1) {
          updatedSites = [
            ...prevSites,
            {
              siteId: mockData.siteId,
              siteName: mockData.siteName,
              data: [mockData],
            },
          ];
        } else {
          updatedSites = prevSites.map((site, index) =>
            index === existingSiteIndex
              ? {
                  ...site,
                  data: pruneData([...site.data, mockData], MAX_SITE_DATA_POINTS),
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

    mockCleanupRef.current = createMockDataStream(handleMockData);
  }, [pruneData, cacheData]);

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

  // Initialize data from IndexedDB with 3s timeout fallback to mock if websocket is also not available
  useEffect(() => {
    let didTimeout = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const initializeData = async () => {
      if (typeof window !== 'undefined') {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              didTimeout = true;
              reject(new Error('IndexedDB timeout'));
            }, 3000);
          });

          const loadPromise = Promise.all([
            loadFromIndexedDB(DATA_STORE),
            loadFromIndexedDB(SITES_STORE),
          ]);

          const [cachedData, cachedSites] = await Promise.race([
            loadPromise,
            timeoutPromise,
          ]);

          if (!didTimeout) {
            if (cachedData.length > 0) {
              setData(cachedData);
            }
            if (cachedSites.length > 0) {
              setSites(cachedSites);
            }
          }
        } catch (e) {
          // Timeout or error
          setIndexedDBTimeout(true);
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    initializeData();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // If IndexedDB timed out and websocket is not open, start mock data stream
  useEffect(() => {
    if (
      indexedDBTimeout &&
      readyState !== ReadyState.OPEN &&
      !usingMockData
    ) {
      setError('IndexedDB connection timed out. Using demo data.');
      startMockDataStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexedDBTimeout, readyState, usingMockData]);

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
        const newData: SiteAnalyticsData = JSON.parse(lastMessage.data);
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
              updatedSites = [
                ...prevSites,
                {
                  siteId: newData.siteId,
                  siteName: newData.siteName,
                  data: [newData],
                },
              ];
            } else {
              updatedSites = prevSites.map((site, index) =>
                index === existingSiteIndex
                  ? {
                      ...site,
                      data: pruneData([...site.data, newData], MAX_SITE_DATA_POINTS),
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

  useEffect(() => {
    const interval = setInterval(() => {
      pruneOldData(DATA_STORE);
      pruneOldData(SITES_STORE);
    }, 5 * 60 * 1000); // Prune every 5 minutes

    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  const stopMockDataStream = useCallback(() => {
    if (mockCleanupRef.current) {
      mockCleanupRef.current();
      mockCleanupRef.current = null;
    }
    setUsingMockData(false);
  }, []);

  // Manage mock data fallback and cleanup
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Only start mock data if not already using it, websocket is not open, and we didn't already start due to indexeddb timeout
    if (
      readyState !== ReadyState.OPEN &&
      !usingMockData &&
      !indexedDBTimeout
    ) {
      console.log('Starting mock data stream - WebSocket not connected');
      cleanup = startMockDataStream ?? undefined; // Fix: assign function, not result
    }

    if (readyState === ReadyState.OPEN && usingMockData) {
      console.log('WebSocket connected - stopping mock data stream');
      stopMockDataStream(); // ✅ stop mock stream
    }

    return () => {
      if (cleanup) {
        console.log('Cleaning up mock data stream');
        cleanup();
      }
    };
  }, [readyState, usingMockData, startMockDataStream, stopMockDataStream, indexedDBTimeout]);

  // Memoized loading state
  const isLoading = useMemo(
    () => data.length === 0 && connectionStatus !== 'connected',
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