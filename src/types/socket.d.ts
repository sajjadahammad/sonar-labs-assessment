export interface TopPage {
    path: string;
    views: number;
  }
  
  export interface PerformanceMetrics {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  }
  
  export interface UserFlow {
    from: string;
    to: string;
    count: number;
  }
  
  export interface SiteAnalyticsData {
    timestamp: string;
    siteId: string;
    siteName: string;
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    topPages: Array<{
      path: string;
      views: number;
    }>;
    performanceMetrics: {
      loadTime: number;
      firstContentfulPaint: number;
      largestContentfulPaint: number;
    };
    userFlow: Array<{
      from: string;
      to: string;
      count: number;
    }>;
  }


export interface UseSiteAnalyticsResult {
    data: SiteAnalyticsData[];
    isLoading: boolean;
    error: Error | null;
    isSocketConnected: boolean;
  }