"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useWallets } from "@/providers/wallet-provider";
import {
  LogOutIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  UserIcon,
  MailIcon,
  WalletIcon,
} from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { toast } from "react-toastify";
import { useUser } from "@/hooks/use-user";

export default function Account() {
  const { state: authState, logout } = useAuth();
  const { state: walletState } = useWallets();
  const { user } = useUser();
  const { selectedAccount } = walletState;
  const [isOpen, setIsOpen] = useState(false);

  console.log("state", authState);
  const handleLogout = () => {
    logout();
  };

  const handleCopyAddress = () => {
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address);
      toast.success("Address copied to clipboard");
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md bg-white hover:bg-gray-100"
      >
        <UserIcon className="w-4 h-4 text-gray-600" />
        {authState.user?.username || "Account"}
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-600" />
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-300 shadow-md rounded-md py-2">
          {/* Username */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span className="font-medium">{user?.username}</span>
            </div>
          </div>

          {/* Email */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MailIcon className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4" />
                <span>{truncateAddress(selectedAccount?.address || "")}</span>
              </div>
              <button
                onClick={handleCopyAddress}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy address"
              >
                <CopyIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 text-red-600"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
