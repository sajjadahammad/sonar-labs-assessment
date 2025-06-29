"use client"

import { useState, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, TrendingUp } from "lucide-react"
import { ChartProps } from "@/types/chart"



export default function UserFlowChart({ data, error }: ChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const formatPageName = (path: string) => {
    if (path === "/") return "Home"
    return path
      .replace("/", "")
      .replace("-", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const [historicalData, setHistoricalData] = useState<
    Array<{
      time: string
      [key: string]: string | number // Dynamic flow paths
    }>
  >([])

  // Get the latest data point
  const latestData = data && data.length > 0 ? data[data.length - 1] : null

  useEffect(() => {
    if (!latestData || !latestData.userFlow || latestData.userFlow.length === 0) {
      return
    }


    const time = new Date(latestData.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })

    // Create dynamic flow data based on actual userFlow data
    const flowData: { [key: string]: string | number } = { time }
    
    latestData.userFlow.forEach((flow: { from: string; to: string; count: number }) => {
      const flowKey = `${formatPageName(flow.from)} → ${formatPageName(flow.to)}`
      flowData[flowKey] = flow.count
    })

    setHistoricalData((prev) => {
      const updated = [...prev, flowData as { time: string; [key: string]: string | number }]
      // Keep only last 15 data points for better visualization
      return updated.slice(-15)
    })
  }, [data.length, latestData?.timestamp]) // Depend on data length and timestamp

  // Get unique flow paths for chart areas
  const flowPaths = historicalData.length > 0 
    ? Object.keys(historicalData[0]).filter(key => key !== 'time')
    : []

  // Colors for different flow paths
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <WifiOff className="h-5 w-5" />
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to connect to WebSocket</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Site Overview */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : latestData?.pageViews || 0}
            </div>
            <p className="text-sm text-muted-foreground">Page Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : latestData?.uniqueVisitors || 0}
            </div>
            <p className="text-sm text-muted-foreground">Unique Visitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${((latestData?.bounceRate || 0) * 100).toFixed(1)}%`}
            </div>
            <p className="text-sm text-muted-foreground">Bounce Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${Math.round(latestData?.avgSessionDuration || 0)}s`}
            </div>
            <p className="text-sm text-muted-foreground">Avg Session</p>
          </CardContent>
        </Card>
      </div> */}

      {/* User Flow Chart */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Top User Flow Paths
              {latestData?.siteName && ` - ${latestData.siteName}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-xs">
                Live Data ({data.length} points)
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Real-time visualization of user navigation patterns</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            { historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} opacity={0.5} />
                  <XAxis
                    dataKey="time"
                    stroke={isDark ? "#9ca3af" : "#6b7280"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={isDark ? "#9ca3af" : "#6b7280"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "User Count", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#ffffff",
                      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: isDark ? "#f3f4f6" : "#111827" }}
                  />
                  {flowPaths.map((path, index) => (
                    <Area
                      key={path}
                      type="monotone"
                      dataKey={path}
                      stackId="1"
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
                    <div className="h-3 bg-muted rounded w-24 mx-auto"></div>
                  </div>
                  <p className="mt-4 text-sm">Waiting for user flow data...</p>
                  {data.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Received {data.length} data points, processing...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flow Details */}
      {latestData?.userFlow && latestData.userFlow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Flow Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestData.userFlow.map((flow: any, index: number) => (
                <div
                  key={`${flow.from}-${flow.to}-${index}`}
                  className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Flow #{index + 1}
                    </Badge>
                    <span className="text-2xl font-bold" style={{ color: colors[index % colors.length] }}>
                      {flow.count}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">{formatPageName(flow.from)}</span>
                      <span>→</span>
                      <span className="font-medium">{formatPageName(flow.to)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">users navigated this path</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {/* {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <p>Total data points: {data.length}</p>
              <p>Historical chart points: {historicalData.length}</p>
              <p>Flow paths: {flowPaths.join(', ')}</p>
              <p>Latest timestamp: {latestData?.timestamp}</p>
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  )
}