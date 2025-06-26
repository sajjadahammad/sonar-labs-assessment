import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Ellipsis, Share2, Star, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"

export default function DashboardWrapper({ children }: Readonly<{
    children: React.ReactNode;
}>) {

    const avatars = [
        { initials: "AL", image: null, backgroundColor: "#e6f3ff", textColor: "#4285f4" },
        { initials: "", image: "/api/placeholder/40/40", backgroundColor: "#f0f0f0", textColor: "#000000" },
        { initials: "DT", image: null, backgroundColor: "#e6ffe6", textColor: "#34a853" },
        { initials: "", image: "/api/placeholder/40/40", backgroundColor: "#f0f0f0", textColor: "#000000" },
        { initials: "+20", image: null, backgroundColor: "#ffffff", textColor: "#9aa0a6" },
    ];
    
    return (
        <SidebarProvider className="font-poppins">
            <AppSidebar />
            <SidebarInset>
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
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                    {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div> */}
                    {/* <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" /> */}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
