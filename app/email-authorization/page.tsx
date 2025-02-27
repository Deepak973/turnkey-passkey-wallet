"use client";

import { useEffect, useState, Suspense } from "react";
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

function EmailAuthorizationContent() {
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
  const [emailauthcompleted, setEmailauthcompleted] = useState(false);

  useEffect(() => {
    if (authIframeClient && userEmail && continueWith && credentialBundle) {
      completeEmailAuth({
        userEmail,
        continueWith,
        credentialBundle,
      }).then(async (success) => {
        setEmailauthcompleted(success);
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

  const updateUserName = async () => {
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
  };

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

        await updateUserName();
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

      if (selectedMethod === "passkey") {
        if (!isVerified) {
          await handlePasskeyRegistration();
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
              await updateUserName();
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
                d="M60.711 16.3597C60.711 11.8335 64.3802 8.16426 68.9064 8.16426C73.4326 8.16426 77.1018 11.8335 77.1018 16.3597H85.266C85.266 7.32447 77.9416 0 68.9064 0C59.8712 0 52.5467 7.32447 52.5467 16.3597H60.711ZM52.4866 24.608C57.042 24.608 60.7349 20.9151 60.7349 16.3597H68.8992C68.8992 25.4241 61.551 32.7723 52.4866 32.7723V24.608ZM77.0779 16.3597C77.0779 20.8766 80.7396 24.5383 85.2565 24.5383V32.7025C76.2306 32.7025 68.9136 25.3856 68.9136 16.3597H77.0779ZM118.389 54.2984C120.252 54.2984 121.762 52.7885 121.762 50.926C121.762 49.0634 120.252 47.5536 118.389 47.5536C116.527 47.5536 115.017 49.0634 115.017 50.926C115.017 52.7885 116.527 54.2984 118.389 54.2984ZM115.017 56.2789V79.7117H121.762V56.2789H115.017ZM131.07 63.4862V68.0609C131.085 70.9894 133.348 73.2421 137.258 73.2552L137.236 80C130.609 79.9778 124.356 75.6384 124.325 68.0826L124.325 68.0687V50.5921H131.07V56.7413H137.246V63.4862H131.07ZM40.8535 79.7117V78.6078C39.3721 79.293 37.7219 79.6754 35.9824 79.6754C29.5671 79.6754 24.3664 74.4747 24.3664 68.0594C24.3664 61.6441 29.5671 56.4434 35.9824 56.4434C37.7219 56.4434 39.3721 56.8258 40.8535 57.511V56.2789H47.5984V68.0416L47.5984 68.0594L47.5984 68.0772V79.7117H40.8535ZM40.8535 68.0709V68.0479C40.8473 65.3629 38.6688 63.1883 35.9824 63.1883C33.2921 63.1883 31.1113 65.3691 31.1113 68.0594C31.1113 70.7496 33.2921 72.9305 35.9824 72.9305C38.6688 72.9305 40.8473 70.7559 40.8535 68.0709ZM70.9101 68.0594C70.9101 65.3692 73.091 63.1883 75.7812 63.1883C78.4715 63.1883 80.6524 65.3692 80.6524 68.0594V79.6643H87.3972V68.0594C87.3972 61.6441 82.1966 56.4435 75.7812 56.4435C69.3659 56.4435 64.1653 61.6441 64.1653 68.0594V79.6643H70.9101V68.0594ZM61.5307 63.2045L62.9188 63.1881L62.8391 56.4437L61.4693 56.4599C55.0901 56.4715 49.8418 61.625 49.8418 68.0594V79.6574H56.5866V68.0594C56.5866 65.3955 58.7742 63.2047 61.4909 63.2047H61.5108L61.5307 63.2045ZM16.2459 48.2961L16.1824 48.2963H16.0361V48.2975C7.43355 48.4098 0.494507 55.4183 0.494507 64.0475C0.494507 72.6767 7.43356 79.6852 16.0361 79.7975V79.7989H16.2282L16.2459 79.7989L22.8061 79.7989L22.8061 73.054L16.2313 73.054C12.4559 73.048 9.22519 70.7191 7.89204 67.42H19.5374L19.5374 60.6752L7.89195 60.6752C9.22111 57.3858 12.4367 55.0607 16.1979 55.0411L22.8061 55.0411L22.8061 48.2963L16.2459 48.2963V48.2961ZM89.4709 79.5832V50.1189H96.2157V79.5832H89.4709ZM98.8409 62.916C103.176 59.7548 105.129 54.579 105.159 50.2283L111.904 50.2748C111.868 55.5061 109.877 61.7175 105.229 66.3125L113.6 79.6689H105.64L97.9704 67.4317L96.3012 64.7682L98.8409 62.916Z"
                fill="black"
                fillOpacity="0.4"
              />
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

  if (emailauthcompleted) {
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
  } else {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-10">
        <h1 className="text-black font-funnel-sans text-[2rem] font-bold">
          Email Verification In Progress...
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
                d="M60.711 16.3597C60.711 11.8335 64.3802 8.16426 68.9064 8.16426C73.4326 8.16426 77.1018 11.8335 77.1018 16.3597H85.266C85.266 7.32447 77.9416 0 68.9064 0C59.8712 0 52.5467 7.32447 52.5467 16.3597H60.711ZM52.4866 24.608C57.042 24.608 60.7349 20.9151 60.7349 16.3597H68.8992C68.8992 25.4241 61.551 32.7723 52.4866 32.7723V24.608ZM77.0779 16.3597C77.0779 20.8766 80.7396 24.5383 85.2565 24.5383V32.7025C76.2306 32.7025 68.9136 25.3856 68.9136 16.3597H77.0779ZM118.389 54.2984C120.252 54.2984 121.762 52.7885 121.762 50.926C121.762 49.0634 120.252 47.5536 118.389 47.5536C116.527 47.5536 115.017 49.0634 115.017 50.926C115.017 52.7885 116.527 54.2984 118.389 54.2984ZM115.017 56.2789V79.7117H121.762V56.2789H115.017ZM131.07 63.4862V68.0609C131.085 70.9894 133.348 73.2421 137.258 73.2552L137.236 80C130.609 79.9778 124.356 75.6384 124.325 68.0826L124.325 68.0687V50.5921H131.07V56.7413H137.246V63.4862H131.07ZM40.8535 79.7117V78.6078C39.3721 79.293 37.7219 79.6754 35.9824 79.6754C29.5671 79.6754 24.3664 74.4747 24.3664 68.0594C24.3664 61.6441 29.5671 56.4434 35.9824 56.4434C37.7219 56.4434 39.3721 56.8258 40.8535 57.511V56.2789H47.5984V68.0416L47.5984 68.0594L47.5984 68.0772V79.7117H40.8535ZM40.8535 68.0709V68.0479C40.8473 65.3629 38.6688 63.1883 35.9824 63.1883C33.2921 63.1883 31.1113 65.3691 31.1113 68.0594C31.1113 70.7496 33.2921 72.9305 35.9824 72.9305C38.6688 72.9305 40.8473 70.7559 40.8535 68.0709ZM70.9101 68.0594C70.9101 65.3692 73.091 63.1883 75.7812 63.1883C78.4715 63.1883 80.6524 65.3692 80.6524 68.0594V79.6643H87.3972V68.0594C87.3972 61.6441 82.1966 56.4435 75.7812 56.4435C69.3659 56.4435 64.1653 61.6441 64.1653 68.0594V79.6643H70.9101V68.0594ZM61.5307 63.2045L62.9188 63.1881L62.8391 56.4437L61.4693 56.4599C55.0901 56.4715 49.8418 61.625 49.8418 68.0594V79.6574H56.5866V68.0594C56.5866 65.3955 58.7742 63.2047 61.4909 63.2047H61.5108L61.5307 63.2045ZM16.2459 48.2961L16.1824 48.2963H16.0361V48.2975C7.43355 48.4098 0.494507 55.4183 0.494507 64.0475C0.494507 72.6767 7.43356 79.6852 16.0361 79.7975V79.7989H16.2282L16.2459 79.7989L22.8061 79.7989L22.8061 73.054L16.2313 73.054C12.4559 73.048 9.22519 70.7191 7.89204 67.42H19.5374L19.5374 60.6752L7.89195 60.6752C9.22111 57.3858 12.4367 55.0607 16.1979 55.0411L22.8061 55.0411L22.8061 48.2963L16.2459 48.2963V48.2961ZM89.4709 79.5832V50.1189H96.2157V79.5832H89.4709ZM98.8409 62.916C103.176 59.7548 105.129 54.579 105.159 50.2283L111.904 50.2748C111.868 55.5061 109.877 61.7175 105.229 66.3125L113.6 79.6689H105.64L97.9704 67.4317L96.3012 64.7682L98.8409 62.916Z"
                fill="black"
                fillOpacity="0.4"
              />
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-[1.375rem] font-funnel-sans font-semibold"></h2>
            <p className="text-[1.125rem] font-funnel-sans text-black/[60%]"></p>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }
}

export default function EmailAuthorization() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-10">
          <div className="w-full max-w-lg p-14 bg-black/[4%] rounded-3xl shadow-sm flex flex-col gap-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-[1.125rem] font-funnel-sans text-black/[60%]">
                Loading...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <EmailAuthorizationContent />
    </Suspense>
  );
}
