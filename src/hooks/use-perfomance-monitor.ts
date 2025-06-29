"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface PerformanceMetrics {
  fps: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  webSocketLatency: number
  timestamp: number
}

interface PerformanceBudget {
  fps: { min: number; warning: number }
  memory: { max: number; warning: number }
  latency: { max: number; warning: number }
}

const DEFAULT_BUDGET: PerformanceBudget = {
  fps: { min: 30, warning: 45 },
  memory: { max: 80, warning: 60 }, // percentage
  latency: { max: 200, warning: 100 }, // milliseconds
}

export function usePerformanceMonitor(budget: PerformanceBudget = DEFAULT_BUDGET) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsLatencyRef = useRef(0)

  // FPS Monitoring
  const measureFPS = useCallback(() => {
    const now = performance.now()
    frameCountRef.current++

    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
      frameCountRef.current = 0
      lastTimeRef.current = now
      return fps
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS)
    return null
  }, [])

  // Memory Usage Monitoring
  const getMemoryUsage = useCallback(() => {
    if ("memory" in performance) {
      const memory = (performance as Performance & { memory: any }).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
      }
    }
    return { used: 0, total: 0, percentage: 0 }
  }, [])

  // WebSocket Latency Monitoring
  const measureWebSocketLatency = useCallback(() => {
    const startTime = performance.now()

    // Simulate WebSocket ping - replace with your actual WebSocket implementation
    return new Promise<number>((resolve) => {
      // Mock latency measurement - replace with actual WebSocket ping
      setTimeout(
        () => {
          const latency = performance.now() - startTime
          wsLatencyRef.current = latency
          resolve(latency)
        },
        Math.random() * 50 + 10,
      ) // Simulate 10-60ms latency
    })
  }, [])

  // Check Performance Budget
  const checkBudget = useCallback(
    (currentMetrics: PerformanceMetrics) => {
      const newAlerts: string[] = []

      // FPS Alerts
      if (currentMetrics.fps < budget.fps.min) {
        newAlerts.push(`Critical: FPS dropped to ${currentMetrics.fps} (below ${budget.fps.min})`)
      } else if (currentMetrics.fps < budget.fps.warning) {
        newAlerts.push(`Warning: FPS at ${currentMetrics.fps} (below ${budget.fps.warning})`)
      }

      // Memory Alerts
      if (currentMetrics.memoryUsage.percentage > budget.memory.max) {
        newAlerts.push(
          `Critical: Memory usage at ${currentMetrics.memoryUsage.percentage}% (above ${budget.memory.max}%)`,
        )
      } else if (currentMetrics.memoryUsage.percentage > budget.memory.warning) {
        newAlerts.push(
          `Warning: Memory usage at ${currentMetrics.memoryUsage.percentage}% (above ${budget.memory.warning}%)`,
        )
      }

      // Latency Alerts
      if (currentMetrics.webSocketLatency > budget.latency.max) {
        newAlerts.push(
          `Critical: WebSocket latency at ${currentMetrics.webSocketLatency}ms (above ${budget.latency.max}ms)`,
        )
      } else if (currentMetrics.webSocketLatency > budget.latency.warning) {
        newAlerts.push(
          `Warning: WebSocket latency at ${currentMetrics.webSocketLatency}ms (above ${budget.latency.warning}ms)`,
        )
      }

      setAlerts(newAlerts)
    },
    [budget],
  )

  // Collect Metrics
  const collectMetrics = useCallback(async () => {
    const fps = frameCountRef.current > 0 ? Math.round((frameCountRef.current * 1000) / 1000) : 60
    const memoryUsage = getMemoryUsage()
    const webSocketLatency = await measureWebSocketLatency()

    const newMetrics: PerformanceMetrics = {
      fps,
      memoryUsage,
      webSocketLatency,
      timestamp: Date.now(),
    }

    setMetrics((prev) => {
      const updated = [...prev, newMetrics].slice(-50) // Keep last 50 data points
      return updated
    })

    checkBudget(newMetrics)
  }, [getMemoryUsage, measureWebSocketLatency, checkBudget])

  // Start Monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return

    setIsMonitoring(true)

    // Start FPS monitoring
    animationFrameRef.current = requestAnimationFrame(measureFPS)

    // Start periodic metrics collection
    intervalRef.current = setInterval(collectMetrics, 1000) // Every second
  }, [isMonitoring, measureFPS, collectMetrics])

  // Stop Monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  // Auto-start monitoring
  useEffect(() => {
    startMonitoring()
  }, [startMonitoring])

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    budget,
  }
}
