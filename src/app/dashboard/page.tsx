'use client'
import { PerformanceChart } from "@/components/charts/PeformanceChart"
import RealTimeChart from "@/components/charts/RealTimeChart"
import UserFlowChart from "@/components/charts/userFlowChart"
import { MetricsGrid } from "@/components/custom/MetricsGrid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLoadingSkeleton from "@/components/loadings/DashboardLoading"

import { useWebSocket } from "@/hooks/use-websocket"
import { AnalyticsData } from "@/types/analytics"
import { BarChart3} from "lucide-react"
import ExportToggle from "@/components/custom/ExportToggle"
import { 
  DashboardFilters, 
  ActiveFilters, 
  useDataFilter, 
  FilterState, 
  defaultFilters 
} from "@/components/custom/DashboardFilter"
import { useCallback, useState } from "react"

export default function Page() {
  const {data:siteData,isLoading} = useWebSocket()
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const filteredData = useDataFilter(siteData as AnalyticsData[], filters) as AnalyticsData[]
  const latestData: AnalyticsData | undefined = filteredData.length > 0 ? filteredData[filteredData.length - 1] : undefined

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const handleUpdateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev: FilterState) => ({ ...prev, ...newFilters }))
  }, [])

  if (isLoading) {
    return <DashboardLoadingSkeleton />
  }

  return (
   <div className="flex flex-col gap-6">
      <div className="flex gap-4 items-start flex-col md:flex-row">
        <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <BarChart3 className="h-6 w-6" />
              <span>Platform Overview</span>
            </h2>
            <p>Real time site overview</p>
        </div>
        <div className="ms-auto">
          <ExportToggle siteData={siteData} latestData={latestData}/>
        </div>
        <DashboardFilters 
            onFiltersChange={handleFiltersChange}
            dataCount={filteredData.length}
          />
 <ActiveFilters 
        filters={filters} 
        onUpdateFilters={handleUpdateFilters}
      />
        
      </div>
      
      <MetricsGrid latestData={latestData}/>
     
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Real-time Activity</CardTitle>
            <CardDescription>Live page views across all monitored sites</CardDescription>
          </CardHeader>
          <CardContent>
          <RealTimeChart data={siteData} error={null}/>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Average performance metrics across sites</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={siteData}  error={null} />
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>User Flow</CardTitle>
            <CardDescription>User flow across all monitored sites</CardDescription>
          </CardHeader>
          <CardContent>
          <UserFlowChart data={siteData}  error={null}/>
          </CardContent>
        </Card>
   </div>
  )
}