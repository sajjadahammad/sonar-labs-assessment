'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import useWebSocketLib, { ReadyState } from 'react-use-websocket';
import type { AnalyticsData } from '@/types/analytics';
import { createMockDataStream } from '@/utils/mockDataGenerator';
import { loadFromIndexedDB, saveToIndexedDB } from '@/utils/indexDB';

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
const DATA_STORE = 'analytics_data';
const SITES_STORE = 'analytics_sites';


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