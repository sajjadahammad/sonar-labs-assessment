'use client'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { ThemeToggle } from "./ThemeToggle"
import { ConnectionStatus } from "./ConnectionStatus"
import { useWebSocket } from "@/hooks/use-websocket"
import { useAuth } from "@/hooks/use-auth"
import { Settings2 } from "lucide-react"

export function SiteHeader() {
    const { connectionStatus } = useWebSocket()
    const { user, signOut, loginAs } = useAuth()
    const avatars = [
        { initials: "AL", image: null, backgroundColor: "#e6f3ff", textColor: "#4285f4" },
        { initials: "", image: "/api/placeholder/40/40", backgroundColor: "#f0f0f0", textColor: "#000000" },
        { initials: "DT", image: null, backgroundColor: "#e6ffe6", textColor: "#34a853" },
        { initials: "", image: "/api/placeholder/40/40", backgroundColor: "#f0f0f0", textColor: "#000000" },
        { initials: "+20", image: null, backgroundColor: "#ffffff", textColor: "#9aa0a6" },
    ];
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">
                            Building Your Application
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <ConnectionStatus status={connectionStatus} />
            <div className="ml-auto">
                <ThemeToggle />
                <div className="inline-flex mr-5">
                    {avatars.map((avatar, index) => (
                        <div
                            key={index}
                            className="flex -mr-3 first:ml-0"
                            style={{ zIndex: 5 - index }} >
                            <Avatar className="size-6 border-2 border-white" style={{ backgroundColor: avatar.backgroundColor }}>
                                {avatar.image ? (
                                    <AvatarImage src={avatar.image} alt={`Avatar ${index + 1}`} />
                                ) : null}
                                <AvatarFallback style={{ color: avatar.textColor }}>{avatar.initials}</AvatarFallback>
                            </Avatar>
                        </div>
                    ))}
                </div>


            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                            <p className="text-xs leading-none text-muted-foreground capitalize">Role: {user?.role}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => loginAs("admin")}>Switch to Admin</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loginAs("analyst")}>Switch to Analyst</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loginAs("viewer")}>Switch to Viewer</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

        </header>
    )
}
