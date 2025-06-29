"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteAnalyticsData } from "@/types/socket"

interface TreeNode {
  name: string
  value?: number | string
  children?: TreeNode[]
  type: "root" | "category" | "metric" | "page" | "flow"
}

interface D3TreeNode extends d3.HierarchyPointNode<TreeNode> {
  x0?: number
  y0?: number
  _children?: D3TreeNode[]
}

 const TreeVisualization: React.FC<{ data: SiteAnalyticsData}> = ({ data }) => {
  let i = 0
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Transform websocket data into tree structure
  const transformDataToTree = (data: SiteAnalyticsData): TreeNode => {
    return {
      name: data.siteName,
      type: "root",
      children: [
        {
          name: "Analytics",
          type: "category",
          children: [
            { name: "Page Views", value: data.pageViews, type: "metric" },
            { name: "Unique Visitors", value: data.uniqueVisitors, type: "metric" },
            { name: "Bounce Rate", value: `${(data.bounceRate * 100).toFixed(1)}%`, type: "metric" },
            { name: "Avg Session", value: `${data.avgSessionDuration}s`, type: "metric" },
          ],
        },
        {
          name: "Top Pages",
          type: "category",
          children: (data?.topPages || []).map((page) => ({
            name: page.path,
            value: page.views,
            type: "page" as const,
          })),
        },
        {
          name: "Performance",
          type: "category",
          children: [
            { name: "Load Time", value: `${data.performanceMetrics?.loadTime?.toFixed(2) || 0}s`, type: "metric" },
            { name: "First Paint", value: `${data.performanceMetrics?.firstContentfulPaint?.toFixed(2) || 0}s`, type: "metric" },
            { name: "Largest Paint", value: `${data.performanceMetrics?.largestContentfulPaint?.toFixed(2) || 0}s`, type: "metric" },
          ],
        },
        {
          name: "User Flow",
          type: "category",
          children: (data?.userFlow || []).map((flow) => ({
            name: `${flow.from} → ${flow.to}`,
            value: flow.count,
            type: "flow" as const,
          })),
        },
      ].filter(category => category.children && category.children.length > 0), // Filter out empty categories
    }
  }

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 120, bottom: 20, left: 120 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Create tree layout
    const treemap = d3.tree<TreeNode>().size([height, width])

    // Transform data and create hierarchy
    const treeData = transformDataToTree(data)
    const root = d3.hierarchy(treeData, (d) => d.children) as D3TreeNode
    root.x0 = height / 2
    root.y0 = 0

    // Collapse all children initially except first level
    const collapse = (d: D3TreeNode) => {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = undefined
      }
    }

    if (root.children) {
      root.children.forEach(collapse)
    }

    // Color scale for different node types
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["root", "category", "metric", "page", "flow"])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"])

    const update = (source: D3TreeNode) => {
      // Compute the new tree layout
      const treeData = treemap(root)
      const nodes = treeData.descendants()
      const links = treeData.descendants().slice(1)

      // Normalize for fixed-depth
      nodes.forEach((d) => {
        d.y = d.depth * 180
      })

      // Update the nodes
      const node = g.selectAll("g.node").data(nodes, (d: any) => d.id || (d.id = ++i))

      // Enter any new nodes at the parent's previous position
      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${source.y0 || 0},${source.x0 || 0})`)
        .on("click", click)

      // Add Circle for the nodes
      nodeEnter
        .append("circle")
        .attr("class", "node")
        .attr("r", 1e-6)
        .style("fill", (d) => (d._children ? colorScale(d.data.type) : "#fff"))
        .style("stroke", (d) => colorScale(d.data.type))
        .style("stroke-width", "2px")
        .style("cursor", "pointer")

      // Add labels for the nodes
      nodeEnter
        .append("text")
        .attr("dy", ".35em")
        .attr("x", (d) => (d.children || d._children ? -13 : 13))
        .attr("text-anchor", (d) => (d.children || d._children ? "end" : "start"))
        .text((d) => {
          const name = d.data.name
          const value = d.data.value
          return value !== undefined ? `${name}: ${value}` : name
        })
        .style("font-size", "12px")
        .style("font-family", "Arial, sans-serif")
        .style("fill-opacity", 1e-6)

      // Transition nodes to their new position
      const nodeUpdate = nodeEnter.merge(node as any)

      nodeUpdate
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${d.y},${d.x})`)

      nodeUpdate
        .select("circle.node")
        .attr("r", 6)
        .style("fill", (d) => (d._children ? colorScale(d.data.type) : "#fff"))
        .attr("cursor", "pointer")

      nodeUpdate.select("text").style("fill-opacity", 1)

      // Transition exiting nodes to the parent's new position
      const nodeExit = node
        .exit()
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${source.y || 0},${source.x || 0})`)
        .remove()

      nodeExit.select("circle").attr("r", 1e-6)

      nodeExit.select("text").style("fill-opacity", 1e-6)

      // Update the links
      const link = g.selectAll("path.link").data(links, (d: any) => d.id)

      // Enter any new links at the parent's previous position
      const linkEnter = link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", (d) => {
          const o = { x: source.x0 || 0, y: source.y0 || 0 }
          return diagonal(o, o)
        })
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "2px")

      // Transition links to their new position
      linkEnter
        .merge(link as any)
        .transition()
        .duration(750)
        .attr("d", (d) => diagonal(d, d.parent!))

      // Transition exiting nodes to the parent's new position
      link
        .exit()
        .transition()
        .duration(750)
        .attr("d", (d) => {
          const o = { x: source.x || 0, y: source.y || 0 }
          return diagonal(o, o)
        })
        .remove()

      // Store the old positions for transition
      nodes.forEach((d) => {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

    // Creates a curved (diagonal) path from parent to the child nodes
    const diagonal = (s: { x: number; y: number }, d: { x: number; y: number }) => {
      const path = `M ${s.y} ${s.x}
                    C ${(s.y + d.y) / 2} ${s.x},
                      ${(s.y + d.y) / 2} ${d.x},
                      ${d.y} ${d.x}`
      return path
    }

    // Toggle children on click
    function click(event: any, d: D3TreeNode) {
      if (d.children) {
        d._children = d.children
        d.children = undefined
      } else {
        d.children = d._children
        d._children = undefined
      }
      update(d)
    }

    // Initial render
    update(root)
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
          <span>Website Analytics Tree</span>
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
        <div className="mt-2 text-xs text-muted-foreground">Click on nodes to expand/collapse branches</div>
      </CardContent>
    </Card>
  )
}

export default TreeVisualization