'use client'

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation";
import Link from "next/link"
import {
  Activity,
  Cpu,
  ClipboardPlus,
  Settings,
  Zap,
  GalleryVerticalEnd,
  Users,
  Handshake,
  ChartArea
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/store/features/authSlice";

// Map icon string to Lucide icon component
const iconMap: Record<string, React.ElementType> = {
  dashboard: Activity,
  performance: Cpu,
  reports: ClipboardPlus,
  settings: Settings,
  zap: Zap,
  user:Users,
  collaboration:Handshake,
  chartarea:ChartArea
}

// This is sample data.
const data = {
  // versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      items: [
        {
          title: "Real Time Overview",
          url: "/dashboard",
          icon: "dashboard",
          roles: ["admin", "analyst", "viewer"], // All roles can access
        },
        {
          title: "Performance",
          url: "/dashboard/performance",
          icon: "performance",
          roles: ["admin", "analyst"], // Admin and analyst only
        },
        {
          title: "D3",
          url: "/dashboard/d3",
          icon: "chartarea",
          roles: ["admin", "analyst"], // Admin and analyst only
        },
        // {
        //   title: "Reports",
        //   url: "/dashboard/reports",
        //   icon: "reports",
        //   roles: ["admin", "analyst"], // Admin and analyst only
        // },
        {
          title: "Collaboration",
          url: "/dashboard/collaboration",
          icon: "collaboration",
          roles: ["analyst"],
        },
        {
          title: "Site Management",
          url: "/dashboard/site-management",
          icon: "user",
          roles: ["admin"], 
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
          icon: "settings",
          roles: ["admin"], // Admin only
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { hasRole } = useAuth()
  return (
    <Sidebar {...props}>
      <SidebarHeader>
      <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
              <h1 className="text-xl font-bold text-primary bg-clip-text ">
                  SaaS Analytics Platform
                </h1>
              </div>
              
            </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="uppercase">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item, idx) => {
                  const Icon = iconMap[item.icon] || null
                 
                  
                  // Check if user has required role for this menu item
                  const hasRequiredRole = item.roles ? hasRole(item.roles as Role[]) : true
                  
                  // Don't render menu item if user doesn't have required role
                  if (!hasRequiredRole) return null
                  return (
                    <Link
                      key={idx}
                      href={item.url}
                      className={`${
                        pathname === item.url
                          ? "shadow-sm rounded-md font-medium border transition-all ease-in-out duration-200 text-primary shadow-primary/30"
                          : "text-gray-400 "
                      } mb-2`}
                    >
                      <SidebarMenuItem key={item.title} >
                        <SidebarMenuButton asChild >
                          <span className="flex items-center gap-2 ">
                            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                            <span>{item.title}</span>
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </Link>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
