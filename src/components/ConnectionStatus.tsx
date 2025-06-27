import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertCircle, Database } from "lucide-react"

interface ConnectionStatusProps {
  status: "connected" | "disconnected" | "connecting" | "error"
  usingMockData?: boolean
}

export function ConnectionStatus({ status, usingMockData }: ConnectionStatusProps) {
  if (usingMockData) {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
      >
        <Database className="h-3 w-3 mr-1" />
        Demo Data
      </Badge>
    )
  }

  const statusConfig = {
    connected: {
      icon: Wifi,
      label: "Live Data",
      className:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    },
    connecting: {
      icon: Wifi,
      label: "Connecting...",
      className:
        "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    },
    disconnected: {
      icon: WifiOff,
      label: "Disconnected",
      className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    },
    error: {
      icon: AlertCircle,
      label: "Connection Error",
      className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
