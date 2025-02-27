"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTurnkey } from "@turnkey/sdk-react";
import { toast } from "sonner";
import {
  checkUsernameExists,
  checkUsernameExistsinDB,
  getUserByEmail,
} from "@/actions/turnkey";
import { Email } from "@/types/turnkey";
import { useAuth } from "@/providers/auth-provider";
import "react-toastify/dist/ReactToastify.css";
import { showToast } from "@/lib/toast";
import { Toaster } from "sonner";

type EarnkitUser = {
  userId: string;
  turnkeyOrganizationId: string;
  email: string;
  username: string;
  isVerified: boolean;
  hasPasskey: boolean;
  turnkeyUserId: string;
};
export default function EmailAuthorization() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authIframeClient, passkeyClient, client } = useTurnkey();
  const { completeEmailAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"email" | "passkey">(
    "email"
  );
  const [isVerified, setIsVerified] = useState(false);
  const [username, setUsername] = useState("");
  const [showUsernameField, setShowUsernameField] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [user, setUser] = useState<EarnkitUser | null>(null);
  const userEmail = searchParams.get("userEmail");
  const continueWith = searchParams.get("continueWith");
  const credentialBundle = searchParams.get("credentialBundle");

  useEffect(() => {
    if (authIframeClient && userEmail && continueWith && credentialBundle) {
      completeEmailAuth({
        userEmail,
        continueWith,
        credentialBundle,
      }).then(async (success) => {
        console.log("success", success);
        if (success) {
          try {
            const user = await getUserByEmail(userEmail as Email);

            console.log("user", user);

            if (user) {
              setUser(user);
              if (user.isVerified) {
                router.push("/dashboard");
              } else {
                setIsVerified(false);
                setShowUsernameField(true);
              }
            }
          } catch (error) {
            console.error("Error checking email:", error);
            toast.error("Failed to verify user");
          }
        }
      });
    }
  }, [authIframeClient, userEmail, continueWith, credentialBundle]);

  const handlePasskeyRegistration = async () => {
    if (!userEmail || !passkeyClient) return;

    if (showUsernameField && !username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    try {
      setLoading(true);

      const credential = await passkeyClient?.createUserPasskey({
        publicKey: {
          rp: {
            name: "Turnkey - Demo Embedded Wallet",
          },
          user: {
            name: username,
            displayName: username,
          },
        },
      });

      console.log("credential", credential);
      console.log("user", user);
      console.log(client);

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
          toast.error("Failed to register passkey");
          return;
        }

        // Update user with passkey info and username if provided
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/update-user-passkey`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: userEmail,
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
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to register passkey");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const checkUsername = await checkUsernameExistsinDB(
        username.trim().toLowerCase()
      );
      console.log("checkUsername", checkUsername);
      if (checkUsername) {
        showToast.error({
          message: "Username already exists",
          description: "Please choose a different username",
        });
        setLoading(false);
        return;
      }

      if (showUsernameField && username.trim()) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/update-user`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: userEmail,
              username: username.trim().toLowerCase(),
              isVerified: true,
              hasPasskey: false,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update username");
        }
      }

      if (selectedMethod === "passkey") {
        if (!isVerified) {
          await handlePasskeyRegistration();
        } else {
          router.push(`/login?email=${userEmail}`);
        }
      } else {
        // Handle email authentication
        if (userEmail && continueWith === "email" && credentialBundle) {
          await authIframeClient?.injectCredentialBundle(credentialBundle);
          if (authIframeClient?.iframePublicKey) {
            const loginResponse =
              await authIframeClient?.loginWithReadWriteSession(
                authIframeClient.iframePublicKey
              );
            if (loginResponse?.organizationId) {
              router.push("/dashboard");
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!credentialBundle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-10">
        <h1 className="text-black font-funnel-sans text-[2rem] font-bold">
          Email Verification
        </h1>
        <div className="w-full max-w-lg p-14 bg-black/[4%] rounded-3xl shadow-sm flex flex-col gap-8">
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
                d="M60.711 16.3597C60.711 11.8335 64.3802 8.16426 68.9064 8.16426C73.4326 8.16426 77.1018 11.8335 77.1018 16.3597H85.266C85.266 7.32447 77.9416 0 68.9064 0C59.8712 0 52.5467 7.32447 52.5467 16.3597H60.711Z"
                fill="black"
                fillOpacity="0.4"
              />
              {/* ... rest of the SVG path */}
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-[1.375rem] font-funnel-sans font-semibold">
              Confirm your email
            </h2>
            <p className="text-[1.125rem] font-funnel-sans text-black/[60%]">
              Click the link sent to{" "}
              <span className="font-bold">{userEmail}</span> to sign in.
            </p>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-10">
        <div className="w-full max-w-lg p-14 bg-black/[4%] rounded-3xl shadow-sm flex flex-col gap-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-[1.125rem] font-funnel-sans text-black/[60%]">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-10">
      <h1 className="text-black font-funnel-sans text-[2rem] font-bold">
        Create Wallet
      </h1>
      <div className="w-full max-w-lg p-14 bg-black/[4%] rounded-3xl shadow-sm flex flex-col gap-8">
        {loading ? (
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-[1.125rem] font-funnel-sans text-black/[60%]">
              Please wait...
            </p>
          </div>
        ) : (
          <>
            {showUsernameField && (
              <div className="bg-black/[10%] rounded-full flex gap-4 px-10 py-5">
                <label className="text-[1.375rem] font-funnel-sans text-black/[40%] flex items-center">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-transparent outline-none font-funnel-sans text-[1.375rem] ml-4 text-black"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="bg-black/[10%] rounded-full flex items-center gap-3 px-8 py-4 cursor-pointer">
                <input
                  type="radio"
                  name="authMethod"
                  checked={selectedMethod === "passkey"}
                  onChange={() => setSelectedMethod("passkey")}
                  className="form-radio h-4 w-4 text-primary"
                />
                <div className="flex-1">
                  <p className="text-[1.125rem] font-funnel-sans font-medium">
                    Register Passkey
                  </p>
                  <p className="text-[0.875rem] font-funnel-sans text-black/[60%]">
                    Set up biometric authentication
                  </p>
                </div>
              </label>

              <label className="bg-black/[10%] rounded-full flex items-center gap-3 px-8 py-4 cursor-pointer">
                <input
                  type="radio"
                  name="authMethod"
                  checked={selectedMethod === "email"}
                  onChange={() => setSelectedMethod("email")}
                  className="form-radio h-4 w-4 text-primary"
                />
                <div className="flex-1">
                  <p className="text-[1.125rem] font-funnel-sans font-medium">
                    Continue Without Passkey
                  </p>
                  <p className="text-[0.875rem] font-funnel-sans text-black/[60%]">
                    You can add a passkey later
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={handleContinue}
              disabled={loading || (showUsernameField && !username.trim())}
              className="w-full px-10 py-5 bg-primary font-funnel-sans font-medium text-[1.375rem] text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Continue"}
            </button>

            <p className="text-center text-[1rem] font-funnel-sans text-black/[60%]">
              Email: {userEmail}
            </p>
          </>
        )}
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
