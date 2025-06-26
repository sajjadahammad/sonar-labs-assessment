import DashboardWrapper from "@/components/DashboardWrapper";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <DashboardWrapper>
            {children}
        </DashboardWrapper>
    );
}