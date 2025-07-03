'use client'
import { useState, useEffect } from 'react';

interface RawData {
  siteId: string;
  siteName: string;
  pageViews: number;
  timestamp?: number;
  id?: number;
}

export const useDataProcessor = () => {
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setProcessing(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const processData = (data: RawData[]) => {
    const processed = data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp!).toLocaleTimeString(),
    }));
    setProcessedData(processed);
    return processed;
  };

  return { processedData, processing, processData };
};
