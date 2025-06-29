"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Activity, Users, Eye, Clock, Globe, ArrowRight, Zap, MousePointer, ArrowLeft } from "lucide-react"
import { Skeleton } from "../ui/skeleton"

export function IndividualSiteLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <div className="space-y-6">
        {/* Header Loading */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" className="mb-4 bg-white hover:bg-slate-50" disabled>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Sites
            </Button>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-8 w-8 text-slate-100" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Key Metrics Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Eye, color: "blue", title: "Page Views" },
            { icon: Users, color: "green", title: "Unique Visitors" },
            { icon: Activity, color: "orange", title: "Bounce Rate" },
            { icon: Clock, color: "purple", title: "Avg Session" },
          ].map((metric, index) => (
            <Card key={index} className="border-0 shadow-lg bg-card/50 backdrop-blur hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <metric.icon className={`h-4 w-4 text-${metric.color}-600`} />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages Loading */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-slate-600" />
                Top Pages
              </CardTitle>
              <CardDescription>Most visited pages on your site</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(3)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-8 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-10 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance Metrics Loading */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-slate-600" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Site speed and performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Load Time", "First Contentful Paint", "Largest Contentful Paint"].map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{metric}</span>
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* User Flow Loading */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-slate-600" />
              User Flow
            </CardTitle>
            <CardDescription>How users navigate through your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(2)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border-0 shadow-lg bg-gray-900 backdrop-blur hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-6 w-16" />
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="w-16 h-2 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Site Information Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-48" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Performance Breakdown</h3>
                <div className="space-y-3">
                  {["Load Time", "First Contentful Paint", "Largest Contentful Paint"].map((metric, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="capitalize">{metric}</span>
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Site Name</label>
                <Skeleton className="h-6 w-32 mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Site ID</label>
                <Skeleton className="h-5 w-24 mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Last Updated</label>
                <Skeleton className="h-4 w-40 mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Bounce Rate</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Loading site analytics...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
