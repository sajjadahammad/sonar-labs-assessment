import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
  } from "@/components/ui/dropdown-menu"
  import { Button } from "@/components/ui/button"
  import {  Download, FileText, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { SiteAnalyticsData } from "@/types/socket"

interface ExportToggleProps {
  siteData: SiteAnalyticsData[];
  latestData: SiteAnalyticsData | undefined;
}

export default function ExportToggle({siteData, latestData}: ExportToggleProps) {
    const exportToPDF = () => {
        const doc = new jsPDF()
        
        // Add title
        doc.setFontSize(20)
        doc.text('Analytics Dashboard Report', 20, 20)
        
        // Add date
        doc.setFontSize(12)
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35)
        
        // Add latest metrics if available
        if (latestData) {
          doc.setFontSize(14)
          doc.text('Latest Metrics:', 20, 55)
          
          const metricsData: string[][] = [
            ['Metric', 'Value'],
            ['Page Views', latestData.pageViews?.toString() || 'N/A'],
            ['Unique Visitors', latestData.uniqueVisitors?.toString() || 'N/A'],
            ['Bounce Rate', latestData.bounceRate ? `${latestData.bounceRate}%` : 'N/A'],
            ['Session Duration', latestData.avgSessionDuration ? `${latestData.avgSessionDuration}s` : 'N/A'],
          ]
          
          autoTable(doc, {
            startY: 65,
            head: [metricsData[0]],
            body: metricsData.slice(1),
            theme: 'grid'
          })
        }
        
        // Add historical data table
        if (siteData.length > 0) {
          const tableData: (string | number)[][] = siteData.map((item: SiteAnalyticsData, index: number) => [
            index + 1,
            item.pageViews?.toString() || 'N/A',
            item.uniqueVisitors?.toString() || 'N/A',
            item.bounceRate ? `${item.bounceRate}%` : 'N/A',
            item.avgSessionDuration ? `${item.avgSessionDuration}s` : 'N/A',
            new Date(item.timestamp || Date.now()).toLocaleString()
          ])
          
          autoTable(doc, {
            startY: 120,
            head: [['#', 'Page Views', 'Unique Visitors', 'Bounce Rate', 'Session Duration', 'Timestamp']],
            body: tableData,
            theme: 'striped'
          })
        }
        
        doc.save('analytics-dashboard-report.pdf')
      }
    
      const exportToExcel = () => {
        const wb = XLSX.utils.book_new()
        
        // Create summary sheet
        if (latestData) {
          const summaryData: (string | number)[][] = [
            ['Metric', 'Value'],
            ['Page Views', latestData.pageViews || 0],
            ['Unique Visitors', latestData.uniqueVisitors || 0],
            ['Bounce Rate (%)', latestData.bounceRate || 0],
            ['Session Duration (s)', latestData.avgSessionDuration || 0],
            ['Generated On', new Date().toLocaleDateString()]
          ]
          
          const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
          XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
        }
        
        // Create historical data sheet
        if (siteData.length > 0) {
          const historicalData: (string | number)[][] = [
            ['Timestamp', 'Page Views', 'Unique Visitors', 'Bounce Rate (%)', 'Session Duration (s)'],
            ...siteData.map((item: SiteAnalyticsData) => [
              new Date(item.timestamp || Date.now()).toLocaleString(),
              item.pageViews || 0,
              item.uniqueVisitors || 0,
              item.bounceRate || 0,
              item.avgSessionDuration || 0
            ])
          ]
          
          const historicalWs = XLSX.utils.aoa_to_sheet(historicalData)
          XLSX.utils.book_append_sheet(wb, historicalWs, 'Historical Data')
        }
        
        XLSX.writeFile(wb, 'analytics-dashboard-data.xlsx')
      }
    
  return (
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export Data
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Export as PDF
      </DropdownMenuItem>
      <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Export as Excel
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  )
}
