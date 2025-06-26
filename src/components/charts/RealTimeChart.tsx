"use client"

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartDataPoint } from '@/types/chart'
import { SiteAnalyticsData } from '@/types/socket'

interface RealTimeChartProps {
  data: SiteAnalyticsData[]
  isLoading: boolean
  isSocketConnected: boolean
  error: Error | null
}

export default function RealTimeChart({ data, isLoading, isSocketConnected, error }: RealTimeChartProps) {
  // Compute chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.slice(-20).map((item: SiteAnalyticsData) => ({
      time: new Date(item.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      pageViews: item.pageViews,
      uniqueVisitors: item.uniqueVisitors,
      siteName: item.siteName,
    }))
  }, [data])

  if (isLoading) {
    return (
      <div className="h-[300px] w-full">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">Error: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
            <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value, name) => [
                value,
                name === 'pageViews' ? 'Page Views' : 'Unique Visitors',
              ]}
            />
            <Line
              type="monotone"
              dataKey="pageViews"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Page Views"
            />
            <Line
              type="monotone"
              dataKey="uniqueVisitors"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              name="Unique Visitors"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-24 mx-auto"></div>
            </div>
            <p className="mt-4 text-sm">Waiting for real-time data...</p>
          </div>
        </div>
      )}</div>
  )
}
