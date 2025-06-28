'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Custom hook for WebSocket management
export function useWebSocket() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [sites, setSites] = useState<SiteWithAnalytics[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // WebSocket connection using react-use-websocket with reconnection logic
  const { lastMessage, readyState } = useWebSocketLib('ws://localhost:8080', {
    shouldReconnect: () => true, // Automatically reconnect on failure
    reconnectAttempts: 3, // Limit to 3 attempts
    reconnectInterval: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000), // Exponential backoff up to 10s
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
        setUsingMockData(false); // Stop mock data when real connection is restored
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
    let debounceTimer: NodeJS.Timeout;
    if (lastMessage && readyState === ReadyState.OPEN) {
      try {
        const newData: AnalyticsData = JSON.parse(lastMessage.data);
        clearTimeout(debounceTimer); // Clear previous debounce
        debounceTimer = setTimeout(() => {
          setData((prevData) => [...prevData.slice(-1000), newData]);
          setSites((prevSites) => {
            const existingSiteIndex = prevSites.findIndex((s) => s.siteId === newData.siteId);
            if (existingSiteIndex === -1) {
              return [...prevSites, { siteId: newData.siteId, siteName: newData.siteName, data: [newData] }];
            }
            return prevSites.map((site, index) =>
              index === existingSiteIndex ? { ...site, data: [...site.data.slice(-100), newData] } : site
            );
          });
        }, 100); // Debounce by 100ms to smooth updates
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Failed to parse WebSocket data');
      }
    }
    return () => clearTimeout(debounceTimer);
  }, [lastMessage, readyState]);

  // Start mock data stream as a fallback
  const startMockDataStream = useCallback(() => {
    setUsingMockData(true);
    setConnectionStatus('connected'); // Mimic connected state for mock data
    setError('Using demo data - WebSocket server not available');

    const handleMockData = (mockData: AnalyticsData) => {
      setData((prevData) => [...prevData.slice(-1000), mockData]);
      setSites((prevSites) => {
        const existingSiteIndex = prevSites.findIndex((s) => s.siteId === mockData.siteId);
        if (existingSiteIndex === -1) {
          return [
            ...prevSites,
            {
              siteId: mockData.siteId,
              siteName: mockData.siteName,
              data: [mockData],
            },
          ];
        }
        return prevSites.map((site, index) =>
          index === existingSiteIndex
            ? { ...site, data: [...site.data.slice(-100), mockData] }
            : site,
        );
      });
    };

    const cleanup = createMockDataStream(handleMockData);
    return cleanup;
  }, []);

  // Manage mock data fallback and cleanup
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (readyState !== ReadyState.OPEN && !usingMockData) {
      console.log('Starting mock data stream - WebSocket not connected');
      cleanup = startMockDataStream();
    } else if (readyState === ReadyState.OPEN && usingMockData && cleanup) {
      cleanup();
      setUsingMockData(false); // Stop mock data when real connection is restored
    }

    return () => {
      if (cleanup) {
        console.log('Cleaning up mock data stream');
        cleanup();
      }
    };
  }, [readyState, usingMockData, startMockDataStream]);

  // Determine loading state
  const isLoading = data.length === 0 && connectionStatus !== 'connected';

  return {
    data,
    sites,
    connectionStatus,
    error,
    usingMockData,
    isLoading,
  };
}