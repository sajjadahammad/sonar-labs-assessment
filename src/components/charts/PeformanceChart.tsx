"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import type { AnalyticsData } from "@/types/analytics";

interface PerformanceChartProps {
  data: AnalyticsData[];
  isLoading: boolean;
  error: Error | null;
}

export function PerformanceChart({ data, isLoading, error }: PerformanceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData = data.slice(-10).map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    "Load Time": item.performanceMetrics.loadTime,
    FCP: item.performanceMetrics.firstContentfulPaint,
    LCP: item.performanceMetrics.largestContentfulPaint,
  }));

  if (isLoading) {
    return (
      <div className="h-[300px] w-full">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              label={{ value: "Seconds", angle: -90, position: "insideLeft" }}
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
            <Legend />
            <Bar dataKey="Load Time" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="FCP" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="LCP" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-24 mx-auto"></div>
            </div>
            <p className="mt-4 text-sm">Waiting for performance data...</p>
          </div>
        </div>
      )}
    </div>
  );
}