"use client";
import { useState } from "react";
import { useTurnkey } from "@turnkey/sdk-react";
import { useUser } from "@/hooks/use-user";
import ActivityCard from "../transactionActivity/activityCard";
import FundsCard from "../walletfunds/fundCard";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { toast } from "react-toastify";

export function Dashboard() {
  const { passkeyClient } = useTurnkey();
  const { user } = useUser();
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);

  const createNewPasskey = async () => {
    if (!user || !passkeyClient) return;

    try {
      const credential = await passkeyClient.createUserPasskey({
        publicKey: {
          rp: {
            name: "Wallet Passkey",
          },
          user: {
            name: user.username,
            displayName: user.username,
          },
        },
      });

      return credential;
    } catch (error) {
      console.error("Error creating passkey:", error);
      throw error;
    }
  };

  const addPasskey = async () => {
    if (!user || !passkeyClient) {
      toast.error("Unable to add passkey at this time");
      return;
    }

    try {
      setIsCreatingPasskey(true);
      const credential = await createNewPasskey();

      if (!credential) {
        throw new Error("Failed to create passkey");
      }

      const authenticatorsResponse = await passkeyClient.createAuthenticators({
        authenticators: [
          {
            authenticatorName: "New Passkey Authenticator",
            challenge: credential.encodedChallenge,
            attestation: credential.attestation,
          },
        ],
        userId: user.userId,
      });

      if (authenticatorsResponse?.activity.id) {
        toast.success("New passkey added successfully!");
        console.log("Authenticator created successfully");
      }
    } catch (error) {
      console.error("Error adding passkey:", error);
      toast.error("Failed to add passkey. Please try again.");
    } finally {
      setIsCreatingPasskey(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <Button
            onClick={addPasskey}
            disabled={isCreatingPasskey}
            className="flex items-center gap-2"
          >
            <KeyRound className="h-5 w-5" />
            {isCreatingPasskey ? "Adding Passkey..." : "Add New Passkey"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Funds Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Wallet Overview
              </h2>
              <FundsCard />
            </div>
          </div>

          {/* Right Column - Activity Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <ActivityCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
