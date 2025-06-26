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
  LayoutDashboard,
  Cpu,
  ClipboardPlus,
  Settings,
  Zap,
} from "lucide-react"

// Map icon string to Lucide icon component
const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  performance: Cpu,
  reports: ClipboardPlus,
  settings: Settings,
  zap: Zap,
}

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: "dashboard", // You can replace with an actual icon component or import later
        },
        {
          title: "Performance",
          url: "#",
          icon: "performance", // Updated icon name
        },
        {
          title: "Reports",
          url: "#",
          icon: "reports", // Updated icon name
        },
        {
          title: "Settings",
          url: "#",
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
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
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
                          ? "shadow-sm rounded-md font-medium border transition-all ease-in-out duration-200"
                          : "text-gray-600"
                      }`}
                    >
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <span className="flex items-center gap-2">
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
