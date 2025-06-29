"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWebSocket } from "@/hooks/use-websocket"
import { Activity, Globe, ArrowRight, BarChart3, Timer } from "lucide-react"
import Link from "next/link"
import { SitesLoading } from "@/components/loadings/SitesLoading"

export default function AllSites() {
  const { data: sitesData, isLoading } = useWebSocket()

  if (isLoading) {
    return <SitesLoading />
  }

  if (!sitesData || sitesData.length === 0) return null

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTotalMetrics = () => {
    return sitesData.reduce(
      (acc, site) => ({
        totalPageViews: acc.totalPageViews + site.pageViews,
        totalUniqueVisitors: acc.totalUniqueVisitors + site.uniqueVisitors,
        avgBounceRate: acc.avgBounceRate + site.bounceRate,
        avgSessionDuration: acc.avgSessionDuration + site.avgSessionDuration,
      }),
      { totalPageViews: 0, totalUniqueVisitors: 0, avgBounceRate: 0, avgSessionDuration: 0 },
    )
  }

  const totalMetrics = getTotalMetrics()
  const avgBounceRate = totalMetrics.avgBounceRate / sitesData.length
  const avgSessionDuration = totalMetrics.avgSessionDuration / sitesData.length

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime < 1) return { status: "Excellent", color: "bg-green-500", textColor: "text-green-700" }
    if (loadTime < 2) return { status: "Good", color: "bg-yellow-500", textColor: "text-yellow-700" }
    return { status: "Needs Improvement", color: "bg-red-500", textColor: "text-red-700" }
  }

  return (
    <div className="min-h-screen   p-6">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <Globe className="h-6 w-6 text-slate-600" />
            Your Websites
          </h2>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quick Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-slate-600" />
              Quick Overview
            </CardTitle>
            <CardDescription>Performance summary across all sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sitesData.filter((site) => site.performanceMetrics.loadTime < 1).length}
                </div>
                <div className="text-sm text-slate-600">Sites with Excellent Performance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sitesData.filter((site) => site.bounceRate < 0.4).length}
                </div>
                <div className="text-sm text-slate-600">Sites with Good Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {sitesData.filter((site) => site.avgSessionDuration > 200).length}
                </div>
                <div className="text-sm text-slate-600">Sites with Long Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Header */}
        
        {/* Sites Grid */}
        <div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sitesData
              .filter((site, index, self) => 
                index === self.findIndex(s => s.siteName === site.siteName)
              )
              .map((site) => {
                const performanceStatus = getPerformanceStatus(site.performanceMetrics.loadTime)
              return (
                <Link key={site.siteId}  href={`/dashboard/site-management/${site.siteId}`}>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-slate-100 group-hover:text-primary transition-colors">
                          {site.siteName}
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <CardDescription className="text-xs">Updated: {formatTimestamp(site.timestamp)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-xl font-bold text-slate-900">{site.pageViews}</div>
                          <div className="text-xs text-slate-600">Page Views</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-xl font-bold text-slate-900">{site.uniqueVisitors}</div>
                          <div className="text-xs text-slate-600">Visitors</div>
                        </div>
                      </div>

                      {/* Performance & Metrics */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-200">Performance</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${performanceStatus.color}`}></div>
                            <span className={`text-xs font-medium ${performanceStatus.textColor}`}>
                              {performanceStatus.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-200">Bounce Rate</span>
                          <span className="font-medium">{(site.bounceRate * 100).toFixed(1)}%</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-200">Avg Session</span>
                          <span className="font-medium">{formatDuration(site.avgSessionDuration)}</span>
                        </div>
                      </div>

                      {/* Top Page */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-600 mb-1">Top Page</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">{site.topPages[0]?.path || "/"}</span>
                          <Badge variant="secondary" className="text-xs">
                            {site.topPages[0]?.views || 0} views
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        
      </div>
    </div>
  )
}
