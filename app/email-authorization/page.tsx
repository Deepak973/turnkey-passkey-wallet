"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { Loader, User, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

import { toast, ToastContainer } from "react-toastify";

type AuthMethod = "passkey" | "email" | null;

function EmailAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeEmailAuth, signupWithPasskey } = useAuth();
  const { authIframeClient, passkeyClient, client } = useTurnkey();
  const userEmail = searchParams.get("userEmail");
  const continueWith = searchParams.get("continueWith");
  const credentialBundle = searchParams.get("credentialBundle");

  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  // Check if client is initialized
  useEffect(() => {
    if (client && passkeyClient) {
      setIsClientReady(true);
    }
  }, [client, passkeyClient]);

  useEffect(() => {
    if (authIframeClient && userEmail && continueWith && credentialBundle) {
      completeEmailAuth({
        userEmail,
        continueWith,
        credentialBundle,
      }).then(async (success) => {
        if (success) {
          try {
            // Check if username exists for this email
            const response = await fetch(
              `/api/auth/check-email?email=${userEmail}`
            );
            const data = await response.json();
            console.log("data", data);

            if (!data.user?.username) {
              setNeedsUsername(true);
            } else {
              router.push("/dashboard");
            }
          } catch (error) {
            console.error("Error checking email:", error);
            toast.error("Failed to verify user");
          }
        }
      });
    }
  }, [authIframeClient, userEmail, continueWith, credentialBundle]);

  const handleCreateUsername = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    try {
      // Check if username is available
      const checkResponse = await fetch(
        `/api/auth/check-username?username=${username}`
      );
      const checkData = await checkResponse.json();

      if (checkData.exists) {
        console.log("Username already taken");
        toast.error("Username already taken");
        return;
      }

      if (userEmail) {
        const response = await fetch("/api/auth/update-username", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            username,
          }),
        });

        const data = await response.json();

        if (true) {
          if (authMethod === "passkey") {
            await handleAddPasskey();
          } else if (authMethod === "email") {
            router.push("/dashboard");
          } else {
            toast.error("Please select an authentication method");
          }
        }
      }
    } catch (error) {
      console.error("Error creating username:", error);
      toast.error("Failed to create username");
    }
  };
  const handleAddPasskey = async () => {
    if (!isClientReady) {
      toast.error("Please wait for client initialization");
      return;
    }

    try {
      setIsAddingPasskey(true);
      // Get user details
      const response = await fetch(
        `/api/auth/get-user-details?userEmail=${userEmail}`
      );
      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to fetch user details");
        return;
      }

      const userDetails = data.user;

      // Create passkey
      const credential = await passkeyClient?.createUserPasskey({
        publicKey: {
          rp: {
            name: "Turnkey - Demo Embedded Wallet",
          },
          user: {
            name: userDetails.username,
            displayName: userDetails.username,
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
          userId: userDetails.userId,
          organizationId: userDetails.organizationId,
        });

        if (authenticatorsResponse?.activity.id) {
          // Update hasPasskey status
          const updateResponse = await fetch(
            "/api/auth/update-passkey-status",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: userEmail,
              }),
            }
          );

          const updateData = await updateResponse.json();

          if (!updateData.success) {
            console.error(
              "Failed to update passkey status:",
              updateData.message
            );
          }

          toast.success("Passkey added successfully!");
          router.push("/dashboard");
        } else {
          throw new Error("Failed to create authenticator");
        }
      }
    } catch (error) {
      console.error("Error adding passkey:", error);
      toast.error("Failed to add passkey");
    } finally {
      setIsAddingPasskey(false);
    }
  };

  return (
    <main className="flex w-full flex-col items-center justify-center min-h-screen p-4">
      <div className="mx-auto w-full sm:w-1/2 bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-6">
        <div className="space-y-4 text-center">
          {/* <Icons.turnkey className="h-12 w-full stroke-0 py-2 dark:stroke-white sm:h-14" /> */}
          <h2 className="text-lg font-semibold flex items-center justify-center">
            {credentialBundle ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                <span className="text-base">Authenticating...</span>
              </div>
            ) : (
              <span>Confirm your email</span>
            )}
          </h2>

          {needsUsername ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Create Your Account</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a username and authentication method
              </p>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all border-gray-300 focus:ring-blue-500"
                  placeholder="Choose a username"
                />
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => setAuthMethod("passkey")}
                  variant={authMethod === "passkey" ? "default" : "outline"}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={!isClientReady || isAddingPasskey}
                >
                  {isAddingPasskey ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <KeyRound className="h-5 w-5" />
                  )}
                  {isAddingPasskey ? "Adding Passkey..." : "Add a passkey"}
                </Button>
                <Button
                  onClick={() => setAuthMethod("email")}
                  variant={authMethod === "email" ? "default" : "outline"}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isAddingPasskey}
                >
                  <Mail className="h-5 w-5" />
                  Continue To dashboard
                </Button>
              </div>

              <Button
                onClick={handleCreateUsername}
                className="w-full mt-4"
                disabled={
                  !username.trim() ||
                  !authMethod ||
                  isAddingPasskey ||
                  !isClientReady
                }
              >
                Continue
              </Button>
            </div>
          ) : (
            !credentialBundle && (
              <p className="text-gray-600 dark:text-gray-400">
                Click the link sent to{" "}
                <span className="font-bold">{userEmail}</span> to sign in.
              </p>
            )
          )}
        </div>
      </div>
    </main>
  );
}

export default function EmailAuth() {
  return (
    <main className="flex w-full flex-col items-center justify-center min-h-screen p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <EmailAuthContent />
      </Suspense>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </main>
  );
}
