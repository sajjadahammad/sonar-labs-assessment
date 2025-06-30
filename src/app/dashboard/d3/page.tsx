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
    
    // Ensure latestData is of the correct type and handle possible undefined
    if (!latestData) {
        return <div>No data available</div>;
    }
    return (
        <div>
            <SunburstVisualization data={latestData as any} />
        </div>
    )
}
