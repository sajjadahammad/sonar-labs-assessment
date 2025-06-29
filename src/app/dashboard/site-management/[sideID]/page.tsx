"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Activity, Users, Eye, Clock, TrendingUp, Globe, ArrowRight, Zap, MousePointer, ArrowLeft } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { IndividualSiteLoading } from "@/components/loadings/IndividualSiteLoading"

interface SiteData {
  siteId: string
  siteName: string
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number
  timestamp: string
  topPages: Array<{ path: string; views: number }>
  performanceMetrics: {
    loadTime: number
    firstContentfulPaint: number
    largestContentfulPaint: number
  }
  userFlow: Array<{ from: string; to: string; count: number }>
}

export default function IndividualSite() {
  const params = useParams()
  const router = useRouter()
  const [siteData, setSiteData] = useState<SiteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const siteId = params.sideID as string

  const { data: wsData } = useWebSocket()

  useEffect(() => {
    if (wsData && Array.isArray(wsData)) {
      const specificSite = wsData.find((site: SiteData) => site.siteId === siteId)
      if (specificSite) {
        setSiteData(specificSite)
      }
      setIsLoading(false)
    }
  }, [wsData, siteId])

  const onBack = () => {
    router.push('/dashboard/site-management')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (isLoading) {
    return <IndividualSiteLoading/>
  }

  if (!siteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br  p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Site Not Found</h1>
          <p className="text-slate-600 mb-4">The site with ID {siteId} could not be found.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Sites
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  p-6">
      <div className=" space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={onBack} className="mb-4 bg-white hover:bg-slate-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Sites
            </Button>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Globe className="h-8 w-8 text-slate-100" />
              {siteData.siteName}
            </h1>
            <p className="text-slate-600 mt-1">Last updated: {formatTimestamp(siteData.timestamp)}</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Page Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{siteData.pageViews.toLocaleString()}</div>
              <Badge variant="secondary" className="mt-2 bg-blue-200 text-blue-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{siteData.uniqueVisitors.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-2">
                {((siteData.uniqueVisitors / siteData.pageViews) * 100).toFixed(1)}% of total views
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Bounce Rate</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{(siteData.bounceRate * 100).toFixed(1)}%</div>
              <Progress value={siteData.bounceRate * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Avg Session</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{formatDuration(siteData.avgSessionDuration)}</div>
              <p className="text-xs text-purple-600 mt-2">{siteData.avgSessionDuration} seconds</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-slate-600" />
                Top Pages
              </CardTitle>
              <CardDescription>Most visited pages on your site</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siteData.topPages.map((page, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{page.path}</TableCell>
                      <TableCell className="text-right">{page.views}</TableCell>
                      <TableCell className="text-right">
                        {((page.views / siteData.pageViews) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-slate-600" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Site speed and performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Load Time</span>
                  <span className="font-medium">{siteData.performanceMetrics.loadTime}s</span>
                </div>
                <Progress value={(siteData.performanceMetrics.loadTime / 3) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>First Contentful Paint</span>
                  <span className="font-medium">{siteData.performanceMetrics.firstContentfulPaint}s</span>
                </div>
                <Progress value={(siteData.performanceMetrics.firstContentfulPaint / 2) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Largest Contentful Paint</span>
                  <span className="font-medium">{siteData.performanceMetrics.largestContentfulPaint}s</span>
                </div>
                <Progress value={(siteData.performanceMetrics.largestContentfulPaint / 4) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Flow */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-slate-600" />
              User Flow
            </CardTitle>
            <CardDescription>How users navigate through your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {siteData.userFlow.map((flow, index) => (
                <div key={index} className="flex items-center justify-between p-4  rounded-lg border-0 shadow-lg dark:bg-black/20 backdrop-blur hover:shadow-xl transition-shadow" >
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{flow.from}</Badge>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <Badge variant="outline">{flow.to}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">{flow.count} users</span>
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(flow.count / 15) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Site Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>Comprehensive metrics for {siteData.siteName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{siteData.pageViews}</div>
                  <div className="text-sm text-blue-600">Total Page Views</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{siteData.uniqueVisitors}</div>
                  <div className="text-sm text-green-600">Unique Visitors</div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Performance Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(siteData.performanceMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <Badge variant="secondary">{value}s</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Site Name</label>
                <p className="text-lg font-semibold">{siteData.siteName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Site ID</label>
                <p className="font-mono text-sm  py-2 rounded">{siteData.siteId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Last Updated</label>
                <p className="text-sm">{formatTimestamp(siteData.timestamp)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Bounce Rate</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={siteData.bounceRate * 100} className="flex-1" />
                  <span className="text-sm font-medium">{(siteData.bounceRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
