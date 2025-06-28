'use client'

import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
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
  ChevronsUpDown,
} from "lucide-react"

// Map icon string to Lucide icon component
const iconMap: Record<string, React.ElementType> = {
  dashboard: Activity,
  performance: Cpu,
  reports: ClipboardPlus,
  settings: Settings,
  zap: Zap,
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
          icon: "dashboard", // You can replace with an actual icon component or import later
        },
        {
          title: "Performance",
          url: "/dashboard/performance",
          icon: "performance", // Updated icon name
        },
        {
          title: "Reports",
          url: "/dashboard/reports",
          icon: "reports", // Updated icon name
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
          icon: "settings", // Updated icon name
        },
        
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  return (
    <Sidebar {...props}>
      <SidebarHeader>
      <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
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
