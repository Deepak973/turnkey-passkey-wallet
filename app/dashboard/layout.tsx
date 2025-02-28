import { ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/Sidebar";
// import Header from "@/components/dashboard/Header";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
import { WalletsProvider } from "@/providers/wallet-provider";
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex font-funnel-sans">
      {/* Sidebar */}
      <WalletsProvider>
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 ml-[250px]">
          <div className="p-8">
            {/* Create Button */}
            {/* <Header /> */}
            {children}
          </div>
        </div>
      </WalletsProvider>
    </div>
  );
}
