

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Timer } from "lucide-react"
import { Skeleton } from "../ui/skeleton"

export function SitesLoading() {
  return (
    <div className="min-h-screen p-6">
      {/* Header Loading */}
      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-6 w-6 text-slate-600" />
        <h2 className="text-2xl font-bold text-slate-100">Your Websites</h2>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quick Stats Loading */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-slate-600" />
              Quick Overview
            </CardTitle>
            <CardDescription>Performance summary across all sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sites Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics Loading */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-lg space-y-1">
                    <Skeleton className="h-6 w-12 mx-auto" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg space-y-1">
                    <Skeleton className="h-6 w-12 mx-auto" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                </div>

                {/* Performance & Metrics Loading */}
                <div className="space-y-3">
                  {[...Array(3)].map((_, metricIndex) => (
                    <div key={metricIndex} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Page Loading */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>

                {/* Action Button Loading */}
                <Skeleton className="h-10 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
            <span className="text-sm">Loading your websites...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
