import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from "./SiteHeader"

export default function DashboardWrapper({ children }: Readonly<{
    children: React.ReactNode;
}>) {

   
    
    return (
        <SidebarProvider className="font-poppins">
            <AppSidebar variant="inset"/>
            <SidebarInset>
        <SiteHeader/>
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
