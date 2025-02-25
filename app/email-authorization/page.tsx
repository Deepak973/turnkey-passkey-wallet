"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "react-toastify";

function EmailAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeEmailAuth } = useAuth();
  const { authIframeClient, passkeyClient, client } = useTurnkey();
  const userEmail = searchParams.get("userEmail");
  const continueWith = searchParams.get("continueWith");
  const credentialBundle = searchParams.get("credentialBundle");

  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState<"passkey" | "email" | null>(
    null
  );
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

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
            const response = await fetch(
              `/api/auth/check-email?email=${userEmail}`
            );
            const data = await response.json();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    try {
      // Check username availability
      const checkResponse = await fetch(
        `/api/auth/check-username?username=${username}`
      );
      const checkData = await checkResponse.json();

      if (checkData.exists) {
        toast.error("Username already taken");
        return;
      }

      if (userEmail) {
        const response = await fetch("/api/auth/update-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, username }),
        });

        const data = await response.json();

        if (data.success) {
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

  if (!needsUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-xl p-14 bg-black/[4%] rounded-3xl shadow-sm flex flex-col gap-8">
          <div className="flex justify-center">
            <svg
              width="136.5"
              height="80"
              viewBox="0 0 138 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M60.711 16.3597C60.711 11.8335 64.3802 8.16426 68.9064 8.16426..."
                fill="black"
                fillOpacity="0.4"
              />
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Confirm your email</h2>
            {credentialBundle ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <p className="text-gray-600">
                Click the link sent to{" "}
                <span className="font-bold">{userEmail}</span> to sign in.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-10">
      <h1 className="text-black font-funnel-sans text-[2rem] font-bold">
        Create Account
      </h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg p-14 bg-black/[4%] rounded-3xl shadow-sm flex flex-col gap-8"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <svg
            width="136.5"
            height="80"
            viewBox="0 0 138 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M60.711 16.3597C60.711 11.8335 64.3802 8.16426 68.9064 8.16426..."
              fill="black"
              fillOpacity="0.4"
            />
          </svg>
        </div>

        {/* Username Input */}
        <div className="bg-black/[10%] rounded-full flex gap-4 px-10 py-5">
          <label
            htmlFor="username"
            className="text-[1.375rem] font-funnel-sans text-black/[40%] flex items-center justify-center"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-transparent outline-none font-funnel-sans text-[1.375rem] ml-4 text-black"
          />
        </div>

        {/* Auth Method Selection */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setAuthMethod("passkey")}
            className={`w-full px-10 py-5 font-funnel-sans font-medium text-[1.375rem] rounded-full transition-colors flex items-center justify-center gap-2
              ${
                authMethod === "passkey"
                  ? "bg-primary text-white"
                  : "bg-black/[10%] text-black hover:bg-gray-200"
              }`}
            disabled={!isClientReady || isAddingPasskey}
          >
            <KeyRound className="h-6 w-6" />
            {isAddingPasskey ? "Adding Passkey..." : "Add a passkey"}
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className={`w-full px-10 py-5 font-funnel-sans font-medium text-[1.375rem] rounded-full transition-colors flex items-center justify-center gap-2
              ${
                authMethod === "email"
                  ? "bg-primary text-white"
                  : "bg-black/[10%] text-black hover:bg-gray-200"
              }`}
            disabled={isAddingPasskey}
          >
            <Mail className="h-6 w-6" />
            Continue with Email
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            !username.trim() || !authMethod || isAddingPasskey || !isClientReady
          }
          className="w-full px-10 py-5 bg-primary font-funnel-sans font-medium text-[1.375rem] text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}

export default function EmailAuth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailAuthContent />
    </Suspense>
  );
}
