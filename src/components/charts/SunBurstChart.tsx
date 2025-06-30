"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SiteAnalyticsData } from "@/types/socket"

interface TreeNode {
  name: string
  value?: number | string
  children?: TreeNode[]
  type: "root" | "category" | "metric" | "page" | "flow"
}

interface D3PartitionNode extends d3.HierarchyRectangularNode<TreeNode> {
  current?: D3PartitionNode
  target?: D3PartitionNode
}

const SunburstVisualization: React.FC<{ data: SiteAnalyticsData[] }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Transform websocket data into tree structure
  const transformDataToTree = (data: SiteAnalyticsData): TreeNode => {
    const latestData = data[data.length - 1];
    return {
      name: data.siteName,
      type: "root",
      children: [
        {
          name: "Analytics",
          type: "category",
          children: [
            { name: "Page Views", value: latestData.pageViews, type: "metric" },
            { name: "Unique Visitors", value: latestData.uniqueVisitors, type: "metric" },
            { name: "Bounce Rate", value: Number.parseFloat((latestData.bounceRate * 100).toFixed(1)), type: "metric" },
            { name: "Avg Session", value: latestData.avgSessionDuration, type: "metric" },
          ],
        },
        {
          name: "Top Pages",
          type: "category",
          children: (latestData?.topPages || []).map((page) => ({
            name: latestData.path,
            value: latestData.views,
            type: "page" as const,
          })),
        },
        {
          name: "Performance",
          type: "category",
          children: [
            {
              name: "Load Time",
              value: Number.parseFloat((latestData.performanceMetrics?.loadTime || 0).toFixed(2)),
              type: "metric",
            },
            {
              name: "First Paint",
              value: Number.parseFloat((latestData.performanceMetrics?.firstContentfulPaint || 0).toFixed(2)),
              type: "metric",
            },
            {
              name: "Largest Paint",
              value: Number.parseFloat((latestData.performanceMetrics?.largestContentfulPaint || 0).toFixed(2)),
              type: "metric",
            },
          ],
        },
        {
          name: "User Flow",
          type: "category",
          children: (latestData?.userFlow || []).map((flow: { from: string; to: string; count: number }) => ({
            name: `${flow.from} → ${flow.to}`,
            value: flow.count,
            type: "flow" as const,
          })),
        },
      ].filter((category) => category.children && category.children.length > 0),
    }
  }

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = Math.min(dimensions.width, dimensions.height)
    const height = width
    const radius = width / 6

    // Create the main group and center it
    const g = svg
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${dimensions.width / 2},${dimensions.height / 2})`)

    // Color scale for different node types
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["root", "category", "metric", "page", "flow"])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"])

    // Create hierarchy and partition layout
    const treeData = transformDataToTree(data)
    const root = d3
      .hierarchy(treeData)
      .sum((d) => (d.value ? (typeof d.value === "number" ? d.value : 1) : 1))
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const partition = d3.partition<TreeNode>().size([2 * Math.PI, root.height + 1])

    partition(root)

    // Current focus node
    root.each((d: any) => (d.current = d))

    // Arc generator
    const arc = d3
      .arc<D3PartitionNode>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1))

    // Create paths for each node
    const path = g
      .append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", (d) => {
        // Fix: Use the actual node type instead of going back to parent
        return colorScale(d.data.type as "root" | "category" | "metric" | "page" | "flow")
      })
      .attr("fill-opacity", (d) => (arcVisible(d.current!) ? (d.children ? 0.6 : 0.4) : 0))
      .attr("pointer-events", (d) => (arcVisible(d.current!) ? "auto" : "none"))
      .attr("d", (d) => arc(d.current!))
      .style("cursor", "pointer")
      .on("click", clicked)

    // Add labels
    const label = g
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", (d) => +labelVisible(d.current!))
      .attr("transform", (d) => labelTransform(d.current!))
      .text((d) => {
        const name = d.data.name
        const value = d.data.value
        if (d.depth === 1) return name // Categories show only name
        return value !== undefined ? `${name}: ${value}` : name
      })
      .style("font-size", (d) => (d.depth === 1 ? "14px" : "10px"))
      .style("font-weight", (d) => (d.depth === 1 ? "bold" : "normal"))

    // Center label showing current focus
    const parent = g
      .append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked)

    const centerLabel = g
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", colorScale("root"))
      .text(root.data.name)

    // Click handler
    function clicked(event: any, p: D3PartitionNode) {
      parent.datum(p.parent || root)

      root.each(
        (d: any) =>
          (d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth),
          }),
      )

      const t = g.transition().duration(750)

      // Transition the data on all arcs
      path
        .transition(t)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current!, d.target!)
          return (t) => (d.current = i(t))
        })
        .filter(function (d) {
          return +(this as any).getAttribute("fill-opacity") || arcVisible(d.target!)
        })
        .attr("fill-opacity", (d) => (arcVisible(d.target!) ? (d.children ? 0.6 : 0.4) : 0))
        .attr("pointer-events", (d) => (arcVisible(d.target!) ? "auto" : "none"))
        .attrTween("d", (d) => () => arc(d.current!))

      label
        .filter(function (d) {
          return +(this as any).getAttribute("fill-opacity") || labelVisible(d.target!)
        })
        .transition(t)
        .attr("fill-opacity", (d) => +labelVisible(d.target!))
        .attrTween("transform", (d) => () => labelTransform(d.current!))

      // Update center label
      centerLabel.text(p.data.name)
    }

    function arcVisible(d: D3PartitionNode) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0
    }

    function labelVisible(d: D3PartitionNode) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03
    }

    function labelTransform(d: D3PartitionNode) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI
      const y = ((d.y0 + d.y1) / 2) * radius
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
    }
  }, [data, dimensions])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(600, container.clientHeight),
        })
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!data) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Website Analytics Sunburst</span>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
          <svg ref={svgRef} className="w-full h-full min-h-[600px]" />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Root</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Category</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Metrics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Pages</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>User Flow</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Click on segments to zoom in/out. Click center to zoom out.
        </div>
      </CardContent>
    </Card>
  )
}

export default SunburstVisualization
