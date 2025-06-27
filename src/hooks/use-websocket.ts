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

export function useWebSocket() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [sites, setSites] = useState<SiteWithAnalytics[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // WebSocket connection using react-use-websocket
  const { lastMessage, readyState } = useWebSocketLib('ws://localhost:8080', {
    shouldReconnect: () => true, // Automatic reconnection
    reconnectAttempts: 3, // Match first implementation's max attempts
    reconnectInterval: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000), // Exponential backoff
    onError: () => {
      setConnectionStatus('error');
      setError('WebSocket connection failed');
    },
  });

  // Map readyState to connectionStatus
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

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && readyState === ReadyState.OPEN) {
      try {
        const newData: AnalyticsData = JSON.parse(lastMessage.data);

        // Update data (limit to 1000 entries)
        setData((prevData) => [...prevData.slice(-1199), newData]);

        // Update sites
        setSites((prevSites) => {
          const existingSiteIndex = prevSites.findIndex((s) => s.siteId === newData.siteId);
          if (existingSiteIndex === -1) {
            return [
              ...prevSites,
              {
                siteId: newData.siteId,
                siteName: newData.siteName,
                data: [newData],
              },
            ];
          }
          return prevSites.map((site, index) =>
            index === existingSiteIndex
              ? { ...site, data: [...site.data.slice(-99), newData] }
              : site,
          );
        });
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Failed to parse WebSocket data');
      }
    }
  }, [lastMessage, readyState]);

  // Mock data stream for fallback
  const startMockDataStream = useCallback(() => {
    setUsingMockData(true);
    setConnectionStatus('connected'); // Mimic connected state for mock data
    setError('Using demo data - WebSocket server not available');

    const handleMockData = (mockData: AnalyticsData) => {
      setData((prevData) => [...prevData.slice(-1199), mockData]);
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
            ? { ...site, data: [...site.data.slice(-99), mockData] }
            : site,
        );
      });
    };

    // Start mock data stream with initial data
    const cleanup = createMockDataStream(handleMockData);
    return cleanup;
  }, []);

  // Handle WebSocket disconnection and mock data fallback
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (readyState !== ReadyState.OPEN && !usingMockData) {
      console.log('Starting mock data stream - WebSocket not connected');
      cleanup = startMockDataStream();
    }

    return () => {
      if (cleanup) {
        console.log('Cleaning up mock data stream');
        cleanup();
      }
    };
  }, [readyState, usingMockData, startMockDataStream]);

  // Add isLoading: true if no data and not connected, else false
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