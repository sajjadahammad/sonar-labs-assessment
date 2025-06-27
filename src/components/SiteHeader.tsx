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
import { Ellipsis, Share2, Star, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { ThemeToggle } from "./ThemeToggle"

export function SiteHeader() {
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
                    <div className="ml-auto">
                        <ThemeToggle/>
                        <div className="inline-flex mr-5">
                            {avatars.map((avatar, index) => (
                                <div
                                    key={index}
                                    className="flex -mr-3 first:ml-0"
                                    style={{ zIndex: 5 - index }} >
                                    <Avatar className="size-10 border-2 border-white" style={{ backgroundColor: avatar.backgroundColor }}>
                                        {avatar.image ? (
                                            <AvatarImage src={avatar.image} alt={`Avatar ${index + 1}`} />
                                        ) : null}
                                        <AvatarFallback style={{ color: avatar.textColor }}>{avatar.initials}</AvatarFallback>
                                    </Avatar>
                                </div>
                            ))}
                        </div>

                        <Button variant='outline'><UserPlus className="mr-3" /> Invite</Button>
                    </div>
                    <div className="flex items-center gap-5 ">
                        <Star size={15} className="inline text-zinc-500" />
                        <Share2 size={15} className="inline text-zinc-500" />
                        <Ellipsis size={15} className="inline text-zinc-500" />
                    </div>

                </header>
  )
}
