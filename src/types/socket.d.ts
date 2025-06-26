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
    topPages: TopPage[];
    performanceMetrics: PerformanceMetrics;
    userFlow: UserFlow[];
  }


export interface UseSiteAnalyticsResult {
    data: SiteAnalyticsData[];
    isLoading: boolean;
    error: Error | null;
    isSocketConnected: boolean;
  }