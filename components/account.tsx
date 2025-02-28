"use client";

import { useState, useEffect } from "react";
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
  Settings,
  KeyRound,
} from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { useUser } from "@/hooks/useUser";
import { useTurnkey } from "@turnkey/sdk-react";
import { getUserByEmail } from "@/actions/turnkey";
import { EarnkitUser, Email } from "@/types/turnkey";
// import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Account() {
  const { state: authState, logout } = useAuth();
  const { state: walletState } = useWallets();
  // const { user } = useUser();
  const { selectedAccount } = walletState;
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);
  const { passkeyClient, client } = useTurnkey();

  console.log("state", authState);
  const handleLogout = () => {
    logout();
  };
  const { user } = useUser();

  const handleCopyAddress = () => {
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address);
      showToast.success({ message: "Address copied to clipboard" });
    }
  };

  const handlePasskeyRegistration = async () => {
    if (!passkeyClient) return;

    setIsCreatingPasskey(true);

    try {
      const credential = await passkeyClient?.createUserPasskey({
        publicKey: {
          rp: {
            name: "Turnkey - Demo Embedded Wallet",
          },
          user: {
            name: user?.username,
            displayName: user?.username,
          },
        },
      });

      if (credential) {
        const authenticatorsResponse = await client?.createAuthenticators({
          authenticators: [
            {
              authenticatorName: "Passkey",
              challenge: credential.encodedChallenge,
              attestation: credential.attestation,
            },
          ],
          userId: user?.turnkeyUserId as string,
          organizationId: user?.turnkeyOrganizationId as string,
        });
        console.log("authenticatorsResponse", authenticatorsResponse);

        if (!authenticatorsResponse) {
          showToast.error({ message: "Failed to register passkey" });
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update-user-passkey`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user?.email,
              hasPasskey: true,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to register passkey");
        }

        showToast.success({
          message: "Passkey registered successfully!",
          description: "You can now use your passkey to sign in",
        });

        setIsSettingsOpen(false);
      }
    } catch (error: any) {
      showToast.error({
        message: "Failed to register passkey",
        description: error.message,
      });
    } finally {
      setIsCreatingPasskey(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md bg-white hover:bg-gray-100"
      >
        <UserIcon className="w-4 h-4 text-gray-600" />
        {user?.username || "Account"}
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

          {/* Settings Button */}
          <button
            onClick={() => {
              setIsSettingsOpen(true);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 text-gray-600"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

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

      {/* Settings Modal */}
      {/* <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Settings</h2>

            {!user?.hasPasskey && (
              <button
                onClick={handlePasskeyRegistration}
                disabled={isCreatingPasskey}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Add Passkey</p>
                    <p className="text-sm text-gray-500">
                      Enable biometric login
                    </p>
                  </div>
                </div>
                {isCreatingPasskey && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                )}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
