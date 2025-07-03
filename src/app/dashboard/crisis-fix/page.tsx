// components/Dashboard.tsx
'use client';

import React, { useEffect, useRef, useState,useMemo } from 'react';
import styles from './crisis.module.css';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import { useDataProcessor } from '@/hooks/use-data-processor';

interface RawData {
  siteId: string;
  siteName: string;
  pageViews: number;
  timestamp?: number;
  id?: number;
}

interface DataPoint {
  siteId: string;
  siteName: string;
  pageViews: number;
  timestamp?: number;
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
  const wsRef = useRef<WebSocket | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const { processData } = useDataProcessor();

  useEffect(() => {
    const connectWebSocket = () => {
      wsRef.current = new WebSocket('ws://localhost:8080');
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
                  data: [
                    ...site.data.slice(-MAX_DATA_LENGTH + 1),
                    enrichedData,
                  ],
                }
              : site
          );
        });


      };

      wsRef.current.onerror = () => {
        setTimeout(() => connectWebSocket(), 3000);
      };
    };

    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleSiteSelect = (siteId: string) => {
    setSelectedSite(siteId);
  };

  const siteData = sites.find((s) => s.siteId === selectedSite);
  // Ensure siteData.data is cast to DataPoint[] for processData
  const processed = useMemo(() => {
    return siteData ? processData(siteData.data) : [];
  }, [siteData]);

  return (
    <div className={styles.dashboard}>
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
