"use client"

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartDataPoint, ChartProps } from '@/types/chart'
import { SiteAnalyticsData } from '@/types/socket'
import { useTheme } from 'next-themes'


export default function RealTimeChart({ data, error }: ChartProps) {
    const { theme } = useTheme()
  const isDark = theme === "dark"
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
         <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
           <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} opacity={0.5} />
           <XAxis
             dataKey="time"
             stroke={isDark ? "#9ca3af" : "#6b7280"}
             fontSize={12}
             tickLine={false}
             axisLine={false}
           />
           <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} fontSize={12} tickLine={false} axisLine={false}  label={{ value: "Pageviews", angle: -90, position: "insideLeft" }} />
           <Tooltip
             contentStyle={{
               backgroundColor: isDark ? "#1f2937" : "#ffffff",
               border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
               borderRadius: "8px",
               boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
             }}
             labelStyle={{ color: isDark ? "#f3f4f6" : "#111827" }}
           />
           <Line
             type="monotone"
             dataKey='pageViews'
             stroke='#3b82f6'
             strokeWidth={2}
             dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
             activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
             animationDuration={300}
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
