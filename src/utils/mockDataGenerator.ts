// Mock data generator

import { SiteAnalyticsData } from "@/types/socket";

export const createMockDataStream = (callback: (data: SiteAnalyticsData) => void): () => void => {
    const sites = [
      { siteId: 'site_001', siteName: 'E-commerce Store' },
      { siteId: 'site_002', siteName: 'News Portal' },
      { siteId: 'site_003', siteName: 'SaaS Platform' },
      { siteId: 'site_004', siteName: 'Blog Site' },
      { siteId: 'site_005', siteName: 'Corporate Website' }
    ];
    
    const generateDataPoint = (): SiteAnalyticsData => {
      const site = sites[Math.floor(Math.random() * sites.length)];
      return {
        timestamp: new Date().toISOString(),
        siteId: site.siteId,
        siteName: site.siteName,
        pageViews: Math.floor(Math.random() * 200) + 50,
        uniqueVisitors: Math.floor(Math.random() * 150) + 30,
        bounceRate: Math.random() * 0.6 + 0.2,
        avgSessionDuration: Math.floor(Math.random() * 300) + 60,
        topPages: [
          { path: "/", views: Math.floor(Math.random() * 50) + 20 },
          { path: "/products", views: Math.floor(Math.random() * 40) + 10 },
          { path: "/about", views: Math.floor(Math.random() * 30) + 5 }
        ],
        performanceMetrics: {
          loadTime: Math.random() * 3 + 0.5,
          firstContentfulPaint: Math.random() * 2 + 0.3,
          largestContentfulPaint: Math.random() * 4 + 1.0
        },
        userFlow: [
          { from: "/", to: "/products", count: Math.floor(Math.random() * 20) },
          { from: "/products", to: "/checkout", count: Math.floor(Math.random() * 15) }
        ]
      };
    };
    
    const interval = setInterval(() => {
      callback(generateDataPoint());
    }, 1000 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  };
  