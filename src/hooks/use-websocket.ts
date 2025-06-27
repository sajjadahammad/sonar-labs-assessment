'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const wsLatencyRef = useRef<number>(0); // Store the latest latency
  const lastPingTimeRef = useRef<number | null>(null); // Track when the last ping was sent
  const lastMessageTimeRef = useRef<number | null>(null); // Track when the last message was received

  // WebSocket connection using react-use-websocket with reconnection logic
  const { lastMessage, readyState, getWebSocket } = useWebSocketLib('ws://localhost:8080', {
    shouldReconnect: () => true, // Automatically reconnect on failure
    reconnectAttempts: 3, // Limit to 3 attempts
    reconnectInterval: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000), // Exponential backoff up to 10s
    onError: () => {
      setConnectionStatus('error');
      setError('WebSocket connection failed');
      // Optional retry after max attempts
      if (reconnectAttempts < 3) setTimeout(() => getWebSocket()?.reconnect(), 10000);
    },
  });

  // Measure WebSocket latency based on message round-trip
  const measureWebSocketLatency = useCallback(() => {
    return new Promise<number>((resolve, reject) => {
      const ws = getWebSocket();
      if (!ws || readyState !== ReadyState.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const pingTime = performance.now();
      lastPingTimeRef.current = pingTime;

      // Send a heartbeat message (server can ignore it if not designed for ping)
      ws.send(JSON.stringify({ type: 'heartbeat', timestamp: pingTime }));

      // Check for the next message to calculate latency
      const handleMessage = (event: MessageEvent) => {
        const currentTime = performance.now();
        lastMessageTimeRef.current = currentTime;

        if (lastPingTimeRef.current) {
          const latency = currentTime - lastPingTimeRef.current;
          wsLatencyRef.current = latency; // Update latency ref
          ws.removeEventListener('message', handleMessage); // Clean up listener
          resolve(latency);
        }
      };

      ws.addEventListener('message', handleMessage);

      // Timeout if no response within 5 seconds
      const timeoutId = setTimeout(() => {
        ws.removeEventListener('message', handleMessage);
        if (lastMessageTimeRef.current && lastPingTimeRef.current) {
          const latency = lastMessageTimeRef.current - lastPingTimeRef.current;
          wsLatencyRef.current = latency;
          resolve(latency); // Use last message time as fallback
        } else {
          reject(new Error('Ping timeout'));
        }
      }, 5000);

      // Clean up timeout on resolution
      return () => clearTimeout(timeoutId);
    });
  }, [readyState, getWebSocket]);

  // Periodically measure latency
  useEffect(() => {
    let latencyInterval: NodeJS.Timeout | undefined;

    if (readyState === ReadyState.OPEN) {
      latencyInterval = setInterval(() => {
        measureWebSocketLatency()
          .then((latency) => console.log('WebSocket Latency:', latency.toFixed(2), 'ms'))
          .catch((err) => console.error('Latency measurement failed:', err.message));
      }, 5000); // Measure every 5 seconds
    }

    return () => {
      if (latencyInterval) clearInterval(latencyInterval);
    };
  }, [readyState, measureWebSocketLatency]);

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
    if (lastMessage && readyState === ReadyState.OPEN) {
      try {
        const newData: AnalyticsData = JSON.parse(lastMessage.data);
        const currentTime = performance.now();
        lastMessageTimeRef.current = currentTime;

        // Limit data to 1000 entries
        setData((prevData) => [...prevData.slice(-1000), newData]);
        // Limit site data to 100 entries per site
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
              ? { ...site, data: [...site.data.slice(-100), newData] }
              : site,
          );
        });

        // If a ping was sent, use this message to calculate latency
        if (lastPingTimeRef.current) {
          const latency = currentTime - lastPingTimeRef.current;
          wsLatencyRef.current = latency;
          lastPingTimeRef.current = null; // Reset after measurement
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Failed to parse WebSocket data');
      }
    }
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
    wsLatency: wsLatencyRef.current, // Expose latency to consumers
  };
}