"use client";
import { useState } from "react";
import { useTurnkey } from "@turnkey/sdk-react";
import { useUser } from "@/hooks/use-user";
import ActivityCard from "../transactionActivity/activityCard";
import FundsCard from "../walletfunds/fundCard";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { Email } from "@/types/turnkey";
import { getUserByEmail } from "@/actions/turnkey";
import { showToast } from "@/lib/toast";
import router from "next/router";
import { Toaster } from "sonner";

export function Dashboard() {
  //   try {
  //     // setIsAddingPasskey(true);
  //     // Get user details

  //     const userEmail = user?.email;
  //     console.log("user", user);
  //     const response = await fetch(
  //       `/api/auth/get-user-details?userEmail=${userEmail}`
  //     );
  //     const data = await response.json();

  //     if (!data.success) {
  //       toast.error(data.message || "Failed to fetch user details");
  //       return;
  //     }

  //     const userDetails = data.user;

  //     // Create passkey
  //     const credential = await passkeyClient?.createUserPasskey({
  //       publicKey: {
  //         rp: {
  //           name: "Turnkey - Demo Embedded Wallet",
  //         },
  //         user: {
  //           name: userDetails.username,
  //           displayName: userDetails.username,
  //         },
  //       },
  //     });

  //     if (credential) {
  //       const authenticatorsResponse = await client?.createAuthenticators({
  //         authenticators: [
  //           {
  //             authenticatorName: "Passkey",
  //             challenge: credential.encodedChallenge,
  //             attestation: credential.attestation,
  //           },
  //         ],
  //         userId: userDetails.userId,
  //         organizationId: userDetails.organizationId,
  //       });

  //       if (authenticatorsResponse?.activity.id) {
  //         // Update hasPasskey status
  //         const updateResponse = await fetch(
  //           "/api/auth/update-passkey-status",
  //           {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //             },
  //             body: JSON.stringify({
  //               email: `deepak.rj.dr@gmail.com`,
  //             }),
  //           }
  //         );

  //         const updateData = await updateResponse.json();

  //         if (!updateData.success) {
  //           console.error(
  //             "Failed to update passkey status:",
  //             updateData.message
  //           );
  //         }

  //         toast.success("Passkey added successfully!");
  //         // router.push("/dashboard");
  //       } else {
  //         throw new Error("Failed to create authenticator");
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error adding passkey:", error);
  //     toast.error("Failed to add passkey");
  //   } finally {
  //     // setIsAddingPasskey(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8"></div>

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
