'use client'
import RealTimeChart from "@/components/charts/RealTimeChart"
import useSiteAnalytics from "@/hooks/useSiteAnalytics"

export default function Page() {
  const {data,isLoading,isSocketConnected,error} = useSiteAnalytics()


  if(isLoading){
    return <p>isloading</p>
  }

  return (
   <div>
     <RealTimeChart
        data={data}
        isLoading={isLoading}
        isSocketConnected={isSocketConnected}
        error={error}
      />
   </div>
  )
}
