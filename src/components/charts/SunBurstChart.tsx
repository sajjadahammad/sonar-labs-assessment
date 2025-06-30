"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SiteAnalyticsData } from "@/types/socket"

type TreeNodeType = "root" | "category" | "metric" | "page" | "flow"

interface TreeNode {
  name: string
  value?: number | string
  children?: TreeNode[]
  type: TreeNodeType
}

// Properly extend the D3 hierarchy node with partition properties
interface D3PartitionNode extends d3.HierarchyRectangularNode<TreeNode> {
  current?: D3PartitionNode
  target?: D3PartitionNode
}

const SunburstVisualization: React.FC<{ data: SiteAnalyticsData }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 })

  // Transform websocket data into tree structure
  const transformDataToTree = (data: SiteAnalyticsData): TreeNode => {
    // Helper to ensure children are TreeNode[]
    const toMetricNode = (name: string, value: number | string, type: TreeNodeType): TreeNode => ({
      name,
      value,
      type,
    })

    const analyticsChildren: TreeNode[] = [
      toMetricNode("Page Views", data.pageViews, "metric"),
      toMetricNode("Unique Visitors", data.uniqueVisitors, "metric"),
      toMetricNode("Bounce Rate", Number.parseFloat((data.bounceRate * 100).toFixed(1)), "metric"),
      toMetricNode("Avg Session", data.avgSessionDuration, "metric"),
    ]

    const topPagesChildren: TreeNode[] = (data?.topPages || []).map((page) =>
      toMetricNode(page.path, page.views, "page")
    )

    const performanceChildren: TreeNode[] = [
      toMetricNode(
        "Load Time",
        Number.parseFloat((data.performanceMetrics?.loadTime || 0).toFixed(2)),
        "metric"
      ),
      toMetricNode(
        "First Paint",
        Number.parseFloat((data.performanceMetrics?.firstContentfulPaint || 0).toFixed(2)),
        "metric"
      ),
      toMetricNode(
        "Largest Paint",
        Number.parseFloat((data.performanceMetrics?.largestContentfulPaint || 0).toFixed(2)),
        "metric"
      ),
    ]

    const userFlowChildren: TreeNode[] = (data?.userFlow || []).map((flow: { from: string; to: string; count: number }) =>
      toMetricNode(`${flow.from} → ${flow.to}`, flow.count, "flow")
    )

    // Only add categories if they have children, and ensure each is a TreeNode
    const categories: TreeNode[] = []
    if (analyticsChildren.length > 0) {
      categories.push({
        name: "Analytics",
        type: "category",
        children: analyticsChildren,
      })
    }
    if (topPagesChildren.length > 0) {
      categories.push({
        name: "Top Pages",
        type: "category",
        children: topPagesChildren,
      })
    }
    if (performanceChildren.length > 0) {
      categories.push({
        name: "Performance",
        type: "category",
        children: performanceChildren,
      })
    }
    if (userFlowChildren.length > 0) {
      categories.push({
        name: "User Flow",
        type: "category",
        children: userFlowChildren,
      })
    }

    return {
      name: data.siteName,
      type: "root",
      children: categories.length > 0 ? categories : undefined,
    }
  }

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current)
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
      .scaleOrdinal<TreeNodeType, string>()
      .domain(["root", "category", "metric", "page", "flow"])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"])

    // Create hierarchy and partition layout
    const treeData = transformDataToTree(data)
    const hierarchyRoot = d3
      .hierarchy<TreeNode>(treeData)
      .sum((d) => (d.value ? (typeof d.value === "number" ? d.value : 1) : 1))
      .sort((a, b) => ((b.value ?? 0) - (a.value ?? 0)))

    const partition = d3.partition<TreeNode>().size([2 * Math.PI, hierarchyRoot.height + 1])

    // Apply partition layout - this adds x0, x1, y0, y1 properties
    const root = partition(hierarchyRoot) as D3PartitionNode

    // Current focus node - initialize current property for all nodes
    root.each((d) => {
      const partitionNode = d as D3PartitionNode
      partitionNode.current = {
        x0: partitionNode.x0,
        x1: partitionNode.x1,
        y0: partitionNode.y0,
        y1: partitionNode.y1,
      } as D3PartitionNode
    })

    // Arc generator
    const arc = d3
      .arc<D3PartitionNode>()
      .startAngle((d) => d.current?.x0 ?? d.x0)
      .endAngle((d) => d.current?.x1 ?? d.x1)
      .padAngle((d) => Math.min(((d.current?.x1 ?? d.x1) - (d.current?.x0 ?? d.x0)) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => (d.current?.y0 ?? d.y0) * radius)
      .outerRadius((d) => Math.max((d.current?.y0 ?? d.y0) * radius, ((d.current?.y1 ?? d.y1) * radius) - 1))

    // Get descendants and cast to proper type
    const descendants = root.descendants().slice(1) as D3PartitionNode[]

    // Create paths for each node
    const path = g
      .append("g")
      .selectAll<SVGPathElement, D3PartitionNode>("path")
      .data(descendants)
      .join("path")
      .attr("fill", (d) => colorScale(d.data.type))
      .attr("fill-opacity", (d) => (arcVisible(d) ? (d.children ? 0.6 : 0.4) : 0))
      .attr("pointer-events", (d) => (arcVisible(d) ? "auto" : "none"))
      .attr("d", (d) => arc(d))
      .style("cursor", "pointer")
      .on("click", clicked)

    // Add labels
    const label = g
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll<SVGTextElement, D3PartitionNode>("text")
      .data(descendants)
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", (d) => +labelVisible(d))
      .attr("transform", (d) => labelTransform(d))
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
    function clicked(event: MouseEvent, p: D3PartitionNode) {
      const parentNode = (p.parent as D3PartitionNode) || root
      parent.datum(parentNode)

      root.each((d) => {
        const dNode = d as D3PartitionNode;
        dNode.target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth),
        } as D3PartitionNode;
      });

      const t = path.transition().duration(750);

      // Transition the data on all arcs
      path
        .transition(t as any)
        .tween("data", function (this: SVGPathElement, d) {
          const dNode = d as D3PartitionNode
          const current = dNode.current!
          const target = dNode.target!
          const i = d3.interpolate(current, target)
          return function (t: number) {
            dNode.current = i(t) as D3PartitionNode
          }
        })
        .filter(function (d) {
          const dNode = d as D3PartitionNode
          const currentOpacity = (this as SVGPathElement).getAttribute("fill-opacity")
          return Boolean(currentOpacity && parseFloat(currentOpacity) > 0) || arcVisible(dNode, true)
        })
        .attr("fill-opacity", (d) => {
          const dNode = d as D3PartitionNode
          return arcVisible(dNode, true) ? (dNode.children ? 0.6 : 0.4) : 0
        })
        .attr("pointer-events", (d) => {
          const dNode = d as D3PartitionNode
          return arcVisible(dNode, true) ? "auto" : "none"
        })
        .attrTween("d", function (d) {
          const dNode = d as D3PartitionNode
          return () => arc(dNode) ?? ""
        })

      label
        .filter(function (d) {
          const dNode = d as D3PartitionNode
          const currentOpacity = (this as SVGTextElement).getAttribute("fill-opacity")
          return Boolean(currentOpacity && parseFloat(currentOpacity) > 0) || labelVisible(dNode, true)
        })
        .transition(t as any)
        .attr("fill-opacity", (d) => {
          const dNode = d as D3PartitionNode
          return +labelVisible(dNode, true)
        })
        .attrTween("transform", function (d) {
          const dNode = d as D3PartitionNode
          return () => labelTransform(dNode)
        })

      // Update center label
      centerLabel.text(p.data.name)
    }

    function arcVisible(d: D3PartitionNode, useTarget: boolean = false): boolean {
      const node = useTarget && d.target ? d.target : (d.current || d)
      return node.y1 <= 3 && node.y0 >= 1 && node.x1 > node.x0
    }

    function labelVisible(d: D3PartitionNode, useTarget: boolean = false): boolean {
      const node = useTarget && d.target ? d.target : (d.current || d)
      return node.y1 <= 3 && node.y0 >= 1 && (node.y1 - node.y0) * (node.x1 - node.x0) > 0.03
    }

    function labelTransform(d: D3PartitionNode): string {
      const node = d.current || d
      const x = (((node.x0 + node.x1) / 2) * 180) / Math.PI
      const y = ((node.y0 + node.y1) / 2) * radius
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