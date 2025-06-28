"use client"

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface AlertPanelProps {
  alerts: string[]
  isMonitoring: boolean
}

export function AlertPanel({ alerts, isMonitoring }: AlertPanelProps) {
  const getAlertType = (alert: string) => {
    if (alert.startsWith("Critical:")) return "critical"
    if (alert.startsWith("Warning:")) return "warning"
    return "info"
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "critical":
        return "destructive"
      case "warning":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Alerts</h3>
        <Badge variant={isMonitoring ? "default" : "secondary"}>
          {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>All performance metrics are within budget limits.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, index) => {
            const type = getAlertType(alert)
            return (
              <Alert key={index} variant={getAlertVariant(type) as any}>
                {getAlertIcon(type)}
                <AlertDescription>{alert}</AlertDescription>
              </Alert>
            )
          })}
        </div>
      )}
    </div>
  )
}
