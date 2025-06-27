'use client'
import RealTimeChart from "@/components/charts/RealTimeChart"
import { MetricsGrid } from "@/components/MetricsGrid"
import { useWebSocket } from "@/hooks/use-websocket"
import useSiteAnalytics from "@/hooks/useSiteAnalytics"
import { SiteMetrics } from "@/types/analytics"
import { SiteAnalyticsData } from "@/types/socket"

export default function Page() {
  const {data:siteData,isLoading,isSocketConnected,error} = useWebSocket()


  if(isLoading){
    return <p>isloading</p>
  }

  const latestData: SiteAnalyticsData | undefined = siteData.length > 0 ? siteData[siteData.length - 1] : undefined;

  // Transform to SiteMetrics
  const metrics: SiteMetrics | null = latestData
    ? {
        totalPageViews: latestData.pageViews,
        totalUniqueVisitors: latestData.uniqueVisitors,
        avgSessionDuration: latestData.avgSessionDuration,
        avgBounceRate: latestData.bounceRate,
        // Set change metrics to 0 if no historical data
        pageViewsChange: 0,
        visitorsChange: 0,
        sessionChange: 0,
        bounceRateChange: 0,
      }
    : null;

  return (
   <div>
      <MetricsGrid  metrics={metrics}/>
   </div>
  )
}
