'use client'
import { PerformanceChart } from "@/components/charts/PeformanceChart"
import RealTimeChart from "@/components/charts/RealTimeChart"
import UserFlowChart from "@/components/charts/userFlowChart"
import { MetricsGrid } from "@/components/custom/MetricsGrid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useWebSocket } from "@/hooks/use-websocket"
import { AnalyticsData } from "@/types/analytics"
import { BarChart3, Download, FileText, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import ExportToggle from "@/components/custom/ExportToggle"

export default function Page() {
  const {data:siteData,isLoading} = useWebSocket()
  const latestData: AnalyticsData | undefined = siteData.length > 0 ? siteData[siteData.length - 1] : undefined;


  return (
   <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <BarChart3 className="h-6 w-6" />
              <span>Platform Overview</span>
            </h2>
            <p>Real time site overview</p>
        </div>
        <ExportToggle siteData={siteData} latestData={latestData}/>
        
      </div>
      
      <MetricsGrid latestData={latestData}/>
     
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Real-time Activity</CardTitle>
            <CardDescription>Live page views across all monitored sites</CardDescription>
          </CardHeader>
          <CardContent>
          <RealTimeChart data={siteData} isLoading={isLoading} error={null}/>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Average performance metrics across sites</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={siteData} isLoading={isLoading} error={null} />
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>User Flow</CardTitle>
            <CardDescription>User flow across all monitored sites</CardDescription>
          </CardHeader>
          <CardContent>
          <UserFlowChart data={siteData} isLoading={isLoading} error={null}/>
          </CardContent>
        </Card>
   </div>
  )
}