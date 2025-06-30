
  export interface Site {
    id: string
    siteName: string
    domain: string
    clientId: string
    clientName: string
    status: "healthy" | "warning" | "critical"
  }
  
  export interface Client {
    id: string
    name: string
    industry: string
    sitesCount: number
    status: "active" | "inactive" | "trial"
  }
  
  export interface RealTimeData {
    timestamp: string
    siteId: string
    pageViews: number
    uniqueVisitors: number
    bounceRate: number
    avgSessionDuration: number
    topPages: Array<{
      path: string
      views: number
    }>
    performanceMetrics: {
      loadTime: number
      firstContentfulPaint: number
      largestContentfulPaint: number
    }
    userFlow: Array<{
      from: string
      to: string
      count: number
    }>
  }
  
  export interface SiteMetrics {
    totalPageViews: number;
    totalUniqueVisitors: number;
    avgSessionDuration: number;
    avgBounceRate: number;
    pageViewsChange: number;
    visitorsChange: number;
    sessionChange: number;
    bounceRateChange: number;
  }
  
  export interface User {
    id: string
    name: string
    email: string
    avatar?: string
    role: "admin" | "analyst" | "viewer"
  }
  
  export interface CollaborationMessage {
    id: string
    user: User
    message: string
    timestamp: Date
    siteId?: string
    type: "message" | "insight" | "alert"
  }
  