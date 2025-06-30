'use client'
import SunburstVisualization from "@/components/charts/SunBurstChart";
import { useWebSocket } from "@/hooks/use-websocket";
import DashboardLoadingSkeleton from "@/components/loadings/DashboardLoading";

export default function Sunburst() {
    const {data:siteData,isLoading} = useWebSocket()

    const latestData = siteData[siteData.length - 1];
    
    if (isLoading) {
        return <DashboardLoadingSkeleton />
    }
    
    return (
        <div>
            <SunburstVisualization data={latestData}/>
        </div>
    )
}
