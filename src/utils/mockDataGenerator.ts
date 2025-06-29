import { SiteAnalyticsData } from '@/types/socket';

export const createMockDataStream = (callback: (data: SiteAnalyticsData) => void): () => void => {
  const sites = [
    { siteId: 'site_001', siteName: 'E-commerce Store' },
    { siteId: 'site_002', siteName: 'News Portal' },
    { siteId: 'site_003', siteName: 'SaaS Platform' },
    { siteId: 'site_004', siteName: 'Blog Site' },
    { siteId: 'site_005', siteName: 'Corporate Website' },
  ];

  const generateDataPoint = (): SiteAnalyticsData => {
    const site = sites[Math.floor(Math.random() * sites.length)];
    return {
      timestamp: new Date().toISOString(),
      siteId: site.siteId,
      siteName: site.siteName,
      pageViews: Math.floor(Math.random() * 500) + 50, // Increased range for visibility
      uniqueVisitors: Math.floor(Math.random() * 300) + 30,
      bounceRate: Math.random() * 0.6 + 0.2,
      avgSessionDuration: Math.floor(Math.random() * 600) + 60,
      topPages: [
        { path: '/', views: Math.floor(Math.random() * 50) + 20 },
        { path: '/products', views: Math.floor(Math.random() * 40) + 10 },
        { path: '/about', views: Math.floor(Math.random() * 30) + 5 },
      ],
      performanceMetrics: {
        loadTime: Math.random() * 3 + 0.5,
        firstContentfulPaint: Math.random() * 2 + 0.3,
        largestContentfulPaint: Math.random() * 4 + 1.0,
      },
      userFlow: [
        { from: '/', to: '/products', count: Math.floor(Math.random() * 20) },
        { from: '/products', to: '/checkout', count: Math.floor(Math.random() * 15) },
      ],
    };
  };

  // Generate initial data batch
  for (let i = 0; i < 20; i++) {
    const data = generateDataPoint();
    data.timestamp = new Date(Date.now() - (20 - i) * 2000).toISOString();
    callback(data);
  }

  // Start continuous stream
  const interval = setInterval(() => {
    const data = generateDataPoint();
    console.log('Mock data point:', data); // Debug log
    callback(data);
  }, 1500 + Math.random() * 1000); // Match first implementation’s timing

  return () => clearInterval(interval);
};