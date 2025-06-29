"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Cpu, Wifi} from "lucide-react"
import { usePerformanceMonitor } from "@/hooks/use-perfomance-monitor"
import { PerformanceChart } from "@/components/charts/MonitoringCharts"
import { AlertPanel } from "@/components/custom/AlertPanel"
import PerformanceLoadingSkeleton from "@/components/loadings/PerformanceLoading"


export default function PerformanceDashboard() {
  const { metrics, alerts, isMonitoring, budget } = usePerformanceMonitor()

  const latestMetrics = metrics[metrics.length - 1]

  const getStatusColor = (value: number, min?: number, max?: number, warning?: number) => {
    if (min && value < min) return "text-red-500"
    if (max && value > max) return "text-red-500"
    if (warning && (value < warning || value > warning)) return "text-primary"
    return "text-green-500"
  }

  if (!isMonitoring) {
    return <PerformanceLoadingSkeleton />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Monitor</h1>
          <p className="text-muted-foreground">Real-time application performance metric</p>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isMonitoring ? "Stop" : "Start"} Monitoring
          </Button>
        </div> */}
      </div>

      {/* Current Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FPS</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(
                latestMetrics?.fps || 0,
                budget.fps.min,
                undefined,
                budget.fps.warning,
              )}`}
            >
              {latestMetrics?.fps || 0}
            </div>
            <p className="text-xs text-muted-foreground">Target: ≥{budget.fps.min} FPS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(
                latestMetrics?.memoryUsage.percentage || 0,
                undefined,
                budget.memory.max,
                budget.memory.warning,
              )}`}
            >
              {latestMetrics?.memoryUsage.percentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {latestMetrics?.memoryUsage.used || 0}MB / {latestMetrics?.memoryUsage.total || 0}MB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket Latency</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(
                latestMetrics?.webSocketLatency || 0,
                undefined,
                budget.latency.max,
                budget.latency.warning,
              )}`}
            >
              {Math.round(latestMetrics?.webSocketLatency || 0)}ms
            </div>
            <p className="text-xs text-muted-foreground">Target: ≤{budget.latency.max}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FPS Monitor</CardTitle>
            <CardDescription>Frames per second over time</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart
              data={metrics}
              metric="fps"
              budget={{ min: budget.fps.min, warning: budget.fps.warning }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Memory Usage</CardTitle>
            <CardDescription>JavaScript heap memory percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart
              data={metrics}
              metric="memory"
              budget={{ max: budget.memory.max, warning: budget.memory.warning }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">WebSocket Latency</CardTitle>
            <CardDescription>Connection response time</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart
              data={metrics}
              metric="latency"
              budget={{ max: budget.latency.max, warning: budget.latency.warning }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      <Card>
        <CardContent className="pt-6">
          <AlertPanel alerts={alerts} isMonitoring={isMonitoring} />
        </CardContent>
      </Card>
    </div>
  )
}
