'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import styles from './crisis.module.css';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import { useDataProcessor } from '@/hooks/use-data-processor';
import { createMockDataStream } from '@/utils/mockDataGenerator';

interface RawData {
  siteId: string;
  siteName: string;
  pageViews: number;
  timestamp?: number;
  id?: number;
}

// Add SiteAnalyticsData interface to match the expected parameter type
interface SiteAnalyticsData {
  siteId: string;
  siteName: string;
  pageViews: number;
  timestamp: string; // Note: timestamp is string here
  id?: number;
}

interface SiteData {
  siteId: string;
  siteName: string;
  data: RawData[];
}

const MAX_DATA_LENGTH = 1000;

const Dashboard: React.FC = () => {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const mockCleanupRef = useRef<() => void>(() => {});

  const { processData } = useDataProcessor();

  const startMockDataStream = useCallback(() => {
    if (mockCleanupRef.current) {
      mockCleanupRef.current(); // cleanup previous
    }
    setUsingMockData(true);

    // Accept SiteAnalyticsData as required by createMockDataStream
    const handleMockData = (mockData: SiteAnalyticsData) => {
      // Convert string timestamp to number
      const enrichedData: RawData = {
        ...mockData,
        timestamp: mockData.timestamp ? Number(new Date(mockData.timestamp)) : Date.now(),
        id: Math.random(),
      };

      setSites((prevSites) => {
        const existingSite = prevSites.find((s) => s.siteId === mockData.siteId);
        if (!existingSite) {
          return [
            ...prevSites,
            {
              siteId: mockData.siteId,
              siteName: mockData.siteName,
              data: [enrichedData],
            },
          ];
        }

        return prevSites.map((site) =>
          site.siteId === mockData.siteId
            ? {
                ...site,
                data: [...site.data.slice(-MAX_DATA_LENGTH + 1), enrichedData],
              }
            : site
        );
      });
    };

    // Pass the correctly typed handler
    mockCleanupRef.current = createMockDataStream(handleMockData);
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket('ws://localhost:8080');

        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
          const newData: RawData = JSON.parse(event.data);
          const enrichedData = {
            ...newData,
            timestamp: Date.now(),
            id: Math.random(),
          };

          setSites((prev) => {
            const existingSite = prev.find((s) => s.siteId === newData.siteId);
            if (!existingSite) {
              return [...prev, {
                siteId: newData.siteId,
                siteName: newData.siteName,
                data: [enrichedData],
              }];
            }

            return prev.map((site) =>
              site.siteId === newData.siteId
                ? {
                    ...site,
                    data: [...site.data.slice(-MAX_DATA_LENGTH + 1), enrichedData],
                  }
                : site
            );
          });
        };

        wsRef.current.onerror = () => {
          console.warn('WebSocket error, switching to mock data...');
          wsRef.current?.close();
          startMockDataStream();
        };

        wsRef.current.onclose = () => {
          console.warn('WebSocket closed, switching to mock data...');
          startMockDataStream();
        };
      } catch (err) {
        console.error('WebSocket failed:', err);
        startMockDataStream();
      }
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
      mockCleanupRef.current?.();
    };
  }, [startMockDataStream]);

  const handleSiteSelect = (siteId: string) => {
    setSelectedSite(siteId);
  };

  const siteData = sites.find((s) => s.siteId === selectedSite);
  const processed = useMemo(() => {
    return siteData ? processData(siteData.data) : [];
  }, [siteData]);

  return (
    <div className={styles.dashboard}>
      {usingMockData && (
        <div className={styles.alertBanner}>
          Running in demo mode — WebSocket not available
        </div>
      )}

      <div className={styles.siteSelector}>
        {sites.map((site) => (
          <button
            key={site.siteId}
            onClick={() => handleSiteSelect(site.siteId)}
            className={selectedSite === site.siteId ? styles.active : ''}
          >
            {site.siteName}
          </button>
        ))}
      </div>

      <div ref={chartRef} className={styles.chartContainer}>
        {selectedSite ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processed}>
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Line type="monotone" dataKey="pageViews" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.placeholder}>
            <p>Please select a site to view analytics</p>
          </div>
        )}
      </div>

      <div className={styles.summary}>
        <h3>Sites: {sites.length}</h3>
        <h3>Data Points: {processed.length}</h3>
      </div>
    </div>
  );
};

export default Dashboard;
