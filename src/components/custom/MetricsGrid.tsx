"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SiteMetrics, AnalyticsData } from "@/types/analytics";
import { TrendingUp, TrendingDown, Users, Eye, Clock, MousePointer } from "lucide-react";

interface MetricsGridProps {
  latestData: AnalyticsData | undefined;
}

export function MetricsGrid({ latestData }: MetricsGridProps) {


  const metrics: SiteMetrics | null = latestData
    ? {
        totalPageViews: latestData.pageViews,
        totalUniqueVisitors: latestData.uniqueVisitors,
        avgSessionDuration: latestData.avgSessionDuration,
        avgBounceRate: latestData.bounceRate,
        pageViewsChange:0,
        visitorsChange:  0,
        sessionChange:0,
        bounceRateChange: 0,
      }
    : null;


  const metricCards = [
    {
      title: "Page Views",
      value: metrics?.totalPageViews ?? 0,
      change: metrics?.pageViewsChange ?? 0,
      icon: Eye,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Unique Visitors",
      value: metrics?.totalUniqueVisitors ?? 0,
      change: metrics?.visitorsChange ?? 0,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Avg. Session",
      value: metrics ? `${Math.round(metrics.avgSessionDuration / 60)}m ${metrics.avgSessionDuration % 60}s` : "0m 0s",
      change: metrics?.sessionChange ?? 0,
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Bounce Rate",
      value: metrics ? `${(metrics.avgBounceRate * 100).toFixed(1)}%` : "0.0%",
      change: metrics ? -metrics.bounceRateChange : 0, // Negative because lower bounce rate is better
      icon: MousePointer,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change > 0;
        const changeColor = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

        return (
          <Card key={index} className="border-0 shadow-lg bg-card/50 backdrop-blur hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold text-primary">{metric.value}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${changeColor}`}>
                      {Math.abs(metric.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-muted/50 ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}