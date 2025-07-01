"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Site } from "@/types/analytics"
import { SiteAnalyticsData } from "@/types/socket"
type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error"

// Helper type for site data grouping
type SiteWithAnalytics = {
  siteId: string
  siteName: string
  data: SiteAnalyticsData[]
}

export function useWebSocketNative() {
  const [data, setData] = useState<SiteAnalyticsData[]>([])
  // Use SiteWithAnalytics[] for grouping analytics by siteId
  const [sites, setSites] = useState<SiteWithAnalytics[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mockDataIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3

  // Mock data generator
  const mockSites = [
    { siteId: "site_001", siteName: "E-commerce Store" },
    { siteId: "site_002", siteName: "News Portal" },
    { siteId: "site_003", siteName: "SaaS Platform" },
    { siteId: "site_004", siteName: "Blog Site" },
    { siteId: "site_005", siteName: "Corporate Website" },
  ]

  const generateMockData = useCallback((): SiteAnalyticsData => {
    const site = mockSites[Math.floor(Math.random() * mockSites.length)]
    return {
      timestamp: new Date().toISOString(),
      siteId: site.siteId,
      siteName: site.siteName,
      pageViews: Math.floor(Math.random() * 200) + 50,
      uniqueVisitors: Math.floor(Math.random() * 150) + 30,
      bounceRate: Math.random() * 0.6 + 0.2,
      avgSessionDuration: Math.floor(Math.random() * 300) + 60,
      topPages: [
        { path: "/", views: Math.floor(Math.random() * 50) + 20 },
        { path: "/products", views: Math.floor(Math.random() * 40) + 10 },
        { path: "/about", views: Math.floor(Math.random() * 30) + 5 },
        { path: "/contact", views: Math.floor(Math.random() * 25) + 3 },
        { path: "/blog", views: Math.floor(Math.random() * 35) + 8 },
      ],
      performanceMetrics: {
        loadTime: Math.random() * 3 + 0.5,
        firstContentfulPaint: Math.random() * 2 + 0.3,
        largestContentfulPaint: Math.random() * 4 + 1.0,
      },
      userFlow: [
        { from: "/", to: "/products", count: Math.floor(Math.random() * 20) },
        { from: "/products", to: "/checkout", count: Math.floor(Math.random() * 15) },
        { from: "/", to: "/about", count: Math.floor(Math.random() * 12) },
        { from: "/blog", to: "/", count: Math.floor(Math.random() * 8) },
      ],
    }
  }, [])

  const startMockDataStream = useCallback(() => {
    if (mockDataIntervalRef.current) {
      clearInterval(mockDataIntervalRef.current)
    }
    setIsLoading(true)
    setUsingMockData(true)
    setConnectionStatus("disconnected")
    setError("Using demo data - WebSocket server not available")

    // Generate initial data
    const initialData: SiteAnalyticsData[] = []
    for (let i = 0; i < 20; i++) {
      const mockData = generateMockData()
      mockData.timestamp = new Date(Date.now() - (20 - i) * 2000).toISOString()
      initialData.push(mockData)
    }

    // Process initial data
    initialData.forEach((mockData) => {
      setData((prevData) => [...prevData.slice(-999), mockData])

      setSites((prevSites) => {
        const existingSiteIndex = prevSites.findIndex((s) => s.siteId === mockData.siteId)

        if (existingSiteIndex === -1) {
          return [
            ...prevSites,
            {
              siteId: mockData.siteId,
              siteName: mockData.siteName,
              data: [mockData],
            },
          ]
        } else {
          return prevSites.map((site, index) =>
            index === existingSiteIndex
              ? { ...site, data: [...site.data.slice(-99), mockData] }
              : site,
          )
        }
      })
    })
    setIsLoading(false)
    // Start continuous mock data stream
    mockDataIntervalRef.current = setInterval(
      () => {
        const mockData = generateMockData()

        setData((prevData) => [...prevData.slice(-999), mockData])

        setSites((prevSites) => {
          const existingSiteIndex = prevSites.findIndex((s) => s.siteId === mockData.siteId)

          if (existingSiteIndex === -1) {
            return [
              ...prevSites,
              {
                siteId: mockData.siteId,
                siteName: mockData.siteName,
                data: [mockData],
              },
            ]
          } else {
            return prevSites.map((site, index) =>
              index === existingSiteIndex
                ? { ...site, data: [...site.data.slice(-99), mockData] }
                : site,
            )
          }
        })
      },
      1500 + Math.random() * 1000,
    ) // Random interval between 1.5-2.5 seconds

    console.log("Started mock data stream - WebSocket server not available")
  }, [generateMockData])

  const stopMockDataStream = useCallback(() => {
    if (mockDataIntervalRef.current) {
      clearInterval(mockDataIntervalRef.current)
      mockDataIntervalRef.current = null
    }
    setUsingMockData(false)
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // Stop mock data if running
    stopMockDataStream()
    setIsLoading(true)
    setConnectionStatus("connecting")
    setError(null)

    try {
      wsRef.current = new WebSocket("ws://localhost:8080")

      const connectionTimeout = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          wsRef.current.close()
          console.log("WebSocket connection timeout - switching to mock data")
          startMockDataStream()
        }
      }, 5000) // 5 second timeout

      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout)
        setIsLoading(false)
        setConnectionStatus("connected")
        setError(null)
        reconnectAttempts.current = 0
        setUsingMockData(false)
        console.log("WebSocket connected successfully")
      }

      wsRef.current.onmessage = (event) => {
        try {
          // Use SiteAnalyticsData instead of AnalyticsData
          const newData: SiteAnalyticsData = JSON.parse(event.data)

          setData((prevData) => {
            const updatedData = [...prevData, newData].slice(-1000)
            return updatedData
          })

          setSites((prevSites) => {
            const existingSiteIndex = prevSites.findIndex((s) => s.siteId === newData.siteId)

            if (existingSiteIndex === -1) {
              return [
                ...prevSites,
                {
                  siteId: newData.siteId,
                  siteName: newData.siteName,
                  data: [newData],
                },
              ]
            } else {
              return prevSites.map((site, index) =>
                index === existingSiteIndex
                  ? { ...site, data: [...site.data.slice(-100), newData] }
                  : site,
              )
            }
          })
        } catch (err) {
          console.error("Error parsing WebSocket message:", err)
        }
      }

      wsRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log("WebSocket disconnected:", event.code, event.reason)

        // Only attempt reconnection for unexpected closures
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionStatus("connecting")
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          setConnectionStatus("disconnected")
          // Switch to mock data after failed reconnection attempts
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log("Max reconnection attempts reached - switching to mock data")
            startMockDataStream()
          }
        }
      }

      wsRef.current.onerror = (event) => {
        clearTimeout(connectionTimeout)
        console.error("WebSocket error occurred:", event)
        setConnectionStatus("error")
        setError("WebSocket connection failed")

        // Immediately switch to mock data on error
        setTimeout(() => {
          startMockDataStream()
        }, 1000)
      }
    } catch (err) {
      setConnectionStatus("error")
      setError("Failed to create WebSocket connection")
      console.error("WebSocket creation error:", err)

      // Switch to mock data immediately
      startMockDataStream()
    }
  }, [startMockDataStream, stopMockDataStream])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    stopMockDataStream()

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect")
      wsRef.current = null
    }

    setConnectionStatus("disconnected")
    setError(null)
  }, [stopMockDataStream])

  useEffect(() => {
    // Start connection attempt
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    data,
    sites,
    connectionStatus,
    error,
    usingMockData,
    isLoading,
    connect,
    disconnect,
  }
}
