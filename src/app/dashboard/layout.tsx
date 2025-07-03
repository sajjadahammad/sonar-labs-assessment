'use client'
import DashboardWrapper from "@/components/custom/DashboardWrapper";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { isAuthenticated, isLoading:isAuthLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname()

    // console.log('dads',pathname);
  
    useEffect(() => {
      if (!isAuthLoading) {
        if (isAuthenticated) {
          router.push(pathname);
        } else {
          router.push('/login');
        }
      }
    }, [isAuthenticated, isAuthLoading, router,pathname]);
    return (
        <DashboardWrapper>
            {children}
        </DashboardWrapper>
    );
}