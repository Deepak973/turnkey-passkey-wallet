import { WalletsProvider } from "@/providers/wallet-provider";
import { Dashboard } from "@/components/dashboard/Dashboard";

import NavMenu from "@/components/nav-menu";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({}: {}) {
  return (
    <main className=" h-screen bg-muted/40 dark:bg-neutral-950/80">
      <WalletsProvider>
        <NavMenu />

        <div className="">
          <Dashboard />
        </div>
      </WalletsProvider>
      <Toaster />
    </main>
  );
}
