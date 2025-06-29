export interface ChartDataPoint {
    time: string
    pageViews: number
    uniqueVisitors: number
    siteName: string
  }

  export interface ChartProps {
    data: SiteAnalyticsData[]
    error: Error | null
  }