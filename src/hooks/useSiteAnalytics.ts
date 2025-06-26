'use client'
import { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { SiteAnalyticsData, UseSiteAnalyticsResult } from '@/types/socket';
import { createMockDataStream } from '@/utils/mockDataGenerator';

export default function useSiteAnalytics(): UseSiteAnalyticsResult {
  const [socketData, setSocketData] = useState<SiteAnalyticsData[]>([]);
  const [usingMock, setUsingMock] = useState(false);

  // Connect to WebSocket using react-use-websocket
  const { lastMessage, readyState } = useWebSocket('ws://localhost:8080', {
    shouldReconnect: () => true,
    onOpen: () => {
      setUsingMock(false);
      // Optionally clear mock data if switching from mock to real
    },
    onClose: () => {
      // We'll handle fallback to mock in useEffect below
    },
    onError: () => {
      // We'll handle fallback to mock in useEffect below
    },
    share: true,
  });

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && readyState === ReadyState.OPEN) {
      try {
        const data: SiteAnalyticsData = JSON.parse(lastMessage.data);
        setSocketData((prev) => [...prev, data]);
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    }
  }, [lastMessage, readyState]);

  // Fallback to mock data if WebSocket is not connected
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (readyState !== ReadyState.OPEN) {
      if (!usingMock) {
        setUsingMock(true);
        console.log('Using mock data fallback');
        cleanup = createMockDataStream((data: SiteAnalyticsData) => {
          setSocketData((prev) => [...prev, data]);
        });
      }
    } else {
      // If we reconnect, stop mock data
      setUsingMock(false);
    }

    return () => {
      if (cleanup) cleanup();
    };
    // Only rerun when readyState or usingMock changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyState]);

  // Loading state based on data availability
  const isSocketConnected = readyState === ReadyState.OPEN;
  const isLoading = socketData.length === 0 && !isSocketConnected;
  const error = null; // Add proper error handling if needed

  return {
    data: socketData,
    isLoading,
    error,
    isSocketConnected,
  };
}
