"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { useTheme } from "next-themes"

interface PerformanceMetrics {
  fps: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  webSocketLatency: number
  timestamp: number
}

interface PerformanceChartProps {
  data: PerformanceMetrics[]
  metric: "fps" | "memory" | "latency"
  budget?: { min?: number; max?: number; warning?: number }
}

export function PerformanceChart({ data, metric, budget }: PerformanceChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const chartData = data.map((item, index) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    }),
    value: metric === "fps" ? item.fps : metric === "memory" ? item.memoryUsage.percentage : item.webSocketLatency,
    timestamp: item.timestamp,
  }))

  const getMetricConfig = () => {
    switch (metric) {
      case "fps":
        return {
          label: "FPS",
          color: "#10b981",
          unit: "",
          yAxisDomain: [0, 120],
        }
      case "memory":
        return {
          label: "Memory Usage",
          color: "#f59e0b",
          unit: "%",
          yAxisDomain: [0, 100],
        }
      case "latency":
        return {
          label: "WebSocket Latency",
          color: "#3b82f6",
          unit: "ms",
          yAxisDomain: [0, "dataMax"],
        }
      default:
        return {
          label: "Value",
          color: "#6b7280",
          unit: "",
          yAxisDomain: [0, "dataMax"],
        }
    }
  }

  const config = getMetricConfig()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-lg border shadow-lg ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <p className="font-medium">{`Time: ${label}`}</p>
          <p style={{ color: config.color }}>{`${config.label}: ${payload[0].value}${config.unit}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[200px] w-full">
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
          <YAxis
            stroke={isDark ? "#9ca3af" : "#6b7280"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={config.yAxisDomain}
            label={{ value: config.unit, angle: 0, position: "insideTopRight" }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Budget Lines */}
          {budget?.max && (
            <ReferenceLine
              y={budget.max}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: `Max: ${budget.max}${config.unit}`, position: "topRight" }}
            />
          )}
          {budget?.min && (
            <ReferenceLine
              y={budget.min}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: `Min: ${budget.min}${config.unit}`, position: "bottomRight" }}
            />
          )}
          {budget?.warning && (
            <ReferenceLine
              y={budget.warning}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: `Warning: ${budget.warning}${config.unit}`, position: "topRight" }}
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: config.color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
