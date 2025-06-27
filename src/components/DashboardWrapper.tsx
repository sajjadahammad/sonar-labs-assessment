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
                </div>
            </SidebarInset>
        </SidebarProvider>


    )
}
