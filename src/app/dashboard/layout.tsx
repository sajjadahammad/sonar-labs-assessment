import DashboardWrapper from "@/components/custom/DashboardWrapper";

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