"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import { signOut } from "next-auth/react";
import {
  User,
  Wallet,
  Home,
  FileText,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { getUserByEmail } from "@/actions/turnkey";
import { Email } from "@/types/turnkey";
import { EarnkitUser } from "@/types/turnkey";
import { useUser } from "@/hooks/useUser";

export default function DashboardSidebar() {
  const { user } = useUser();

  const { logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getLinkStyles = (path: string) => {
    return `flex items-center gap-2 px-6 py-3 rounded-lg transition-colors 
            ${
              isActive(path)
                ? "text-black hover:bg-gray-100"
                : "text-black/40 hover:text-black hover:bg-gray-100"
            }`;
  };

  const signOut = () => {
    console.log("signOut");
    sessionStorage.removeItem("email");
    logout();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[250px] bg-[#F8F8F8] flex flex-col justify-between items-center rounded-r-2xl px-6 py-8">
      {/* Main Navigation */}
      <nav className="flex-1 w-full">
        <div className="space-y-4">
          <Link
            href="/dashboard/user/profile"
            className={getLinkStyles("/dashboard/user/profile")}
          >
            <User className="w-5 h-5 mr-1" />
            <span className="text-md font-medium ">
              {"@" + user?.username || "Loading..."}
            </span>
          </Link>
          <Link
            href="/dashboard/wallet"
            className={getLinkStyles("/dashboard/wallet")}
          >
            <Wallet className="w-5 h-5 mr-1" />
            <span className="text-md font-medium">Wallet</span>
          </Link>

          <Link href="/dashboard" className={getLinkStyles("/dashboard")}>
            <Home className="w-5 h-5 mr-1 min-w-5" />
            <span className="text-md font-medium">Home</span>
          </Link>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <nav className="w-full">
        <div className="space-y-6">
          <Link
            href="https://docs.earnkit.com"
            target="_blank"
            className={getLinkStyles("/dashboard/docs")}
          >
            <FileText className="w-5 h-5 mr-1" />
            <span className="text-md font-medium">Docs</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className={getLinkStyles("/dashboard/settings")}
          >
            <Settings className="w-5 h-5 mr-1" />
            <span className="text-md font-medium">Settings</span>
          </Link>

          <button
            onClick={() => signOut()}
            className={getLinkStyles("/dashboard/logout")}
          >
            <LogOut className="w-5 h-5 mr-1" />
            <span className="text-md font-medium">Log out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
