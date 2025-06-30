
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useWebSocketLib, { ReadyState } from 'react-use-websocket';
import { createMockDataStream } from '@/utils/mockDataGenerator';
import { loadFromIndexedDB, pruneOldData, saveToIndexedDB } from '@/utils/indexDB';

// --- Types ---
type AnalyticsData = {
  siteId: string;
  siteName: string;
  [key: string]: any;
};

type SiteData = {
  siteId: string;
  siteName: string;
  data: AnalyticsData[];
};

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Data management constants
const MAX_DATA_POINTS = 1000;
const MAX_SITE_DATA_POINTS = 100;
const DATA_STORE = 'analytics_data';
const SITES_STORE = 'analytics_sites';

// Custom hook for WebSocket management
export function useWebSocket() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const mockCleanupRef = useRef<(() => void) | null>(null);

  // Initialize data from IndexedDB with 2-second timeout and iOS retry
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const initializeData = async () => {
      if (typeof window === 'undefined') return;

      const tryLoadIndexedDB = async (attempt = 1): Promise<void> => {
        try {
          const [cachedData, cachedSites]: [AnalyticsData[], SiteData[]] = await Promise.race([
            Promise.all([
              loadFromIndexedDB(DATA_STORE),
              loadFromIndexedDB(SITES_STORE),
            ]) as Promise<[AnalyticsData[], SiteData[]]>,
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error('IndexedDB timeout')), 3000);
            }),
          ]);

          if (cachedData.length > 0) {
            setData(cachedData);
          }
          if (cachedSites.length > 0) {
            setSites(cachedSites);
          }
        } catch (error: any) {
          console.error('Error initializing data from IndexedDB:', error);
          setError('Failed to load cached data');
          if (
            attempt < 3 &&
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            (error as { message?: string }).message === 'IndexedDB timeout'
          ) {
            console.log(`Retrying IndexedDB load (attempt ${attempt + 1})`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay for iOS lazy-loading
            return tryLoadIndexedDB(attempt + 1);
          }
          setUsingMockData(true);
          startMockDataStream();
        }
      };

      tryLoadIndexedDB();
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cache data to IndexedDB
  const cacheData = useCallback(
    async (newData: AnalyticsData[], newSites: SiteData[]) => {
      if (typeof window !== 'undefined') {
        try {
          await Promise.all([
            saveToIndexedDB(DATA_STORE, newData),
            saveToIndexedDB(SITES_STORE, newSites),
          ]);
        } catch (error) {
          console.error('Error caching data:', error);
          setError('Failed to cache data');
        }
      }
    },
    []
  );

  // Prune data to maintain performance
  const pruneData = useCallback(
    <T,>(dataArray: T[], maxPoints: number): T[] => {
      if (dataArray.length <= maxPoints) return dataArray;
      return dataArray.slice(-maxPoints);
    },
    []
  );

  // WebSocket connection using react-use-websocket
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
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    if (lastMessage && readyState === ReadyState.OPEN) {
      try {
        const newData: AnalyticsData = JSON.parse(lastMessage.data);
        debounceTimer = setTimeout(async () => {
          setData((prevData) => {
            const updatedData = pruneData([...prevData, newData], MAX_DATA_POINTS);
            return updatedData;
          });

          setSites((prevSites) => {
            const existingSiteIndex = prevSites.findIndex((s) => s.siteId === newData.siteId);
            let updatedSites: SiteData[];

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
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [lastMessage, readyState, pruneData, cacheData]);

  // Start mock data stream as a fallback
  const startMockDataStream = useCallback(() => {
    if (mockCleanupRef.current) {
      mockCleanupRef.current();
    }
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
        let updatedSites: SiteData[];

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

        setData((currentData) => {
          cacheData(currentData, updatedSites);
          return currentData;
        });

        return updatedSites;
      });
    };

    mockCleanupRef.current = createMockDataStream(handleMockData);
  }, [pruneData, cacheData]);

  // Stop mock data stream
  const stopMockDataStream = useCallback(() => {
    if (mockCleanupRef.current) {
      mockCleanupRef.current();
      mockCleanupRef.current = null;
    }
    setUsingMockData(false);
  }, []);

  // Manage mock data fallback and cleanup
  useEffect(() => {
    if (readyState !== ReadyState.OPEN && !usingMockData) {
      console.log('Starting mock data stream - WebSocket not connected');
      startMockDataStream();
    }

    if (readyState === ReadyState.OPEN && usingMockData) {
      console.log('WebSocket connected - stopping mock data stream');
      stopMockDataStream();
    }

    return () => {
      if (mockCleanupRef.current) {
        console.log('Cleaning up mock data stream');
        mockCleanupRef.current();
        mockCleanupRef.current = null;
      }
    };
  }, [readyState, usingMockData, startMockDataStream, stopMockDataStream]);

  // Periodic pruning of old data
  useEffect(() => {
    const interval = setInterval(() => {
      pruneOldData(DATA_STORE);
      pruneOldData(SITES_STORE);
    }, 5 * 60 * 1000); // Prune every 5 minutes

    return () => clearInterval(interval);
  }, []);

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
