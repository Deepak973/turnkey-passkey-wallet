import { useState, useEffect } from "react";

import { Email, EarnkitUser } from "@/types/turnkey";
import { getUserByEmail } from "@/actions/turnkey";
import { useTurnkey } from "@turnkey/sdk-react";
import { showToast } from "@/lib/toast";

export function useUser() {
  const [user, setUser] = useState<EarnkitUser | null>(null);
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);
  const { passkeyClient, client } = useTurnkey();

  const getUser = async () => {
    try {
      const userData = await getUserByEmail(
        sessionStorage.getItem("email") as Email
      );
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };

  const handlePasskeyRegistration = async () => {
    console.log("passkeyClient", passkeyClient);
    if (!passkeyClient) return;

    setIsCreatingPasskey(true);

    try {
      const userData = await getUser();
      if (!userData) {
        showToast.error({ message: "User not found" });
        return;
      }

      const credential = await passkeyClient?.createUserPasskey({
        publicKey: {
          rp: {
            name: "Turnkey - Demo Embedded Wallet",
          },
          user: {
            name: userData?.username,
            displayName: userData?.username,
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
          userId: userData?.turnkeyUserId as string,
          organizationId: userData?.turnkeyOrganizationId as string,
        });

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
              email: userData.email,
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

        // Refresh user data after successful passkey registration
        await getUser();
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

  useEffect(() => {
    getUser();
  }, []);

  return {
    user,
    isCreatingPasskey,
    getUser,
    handlePasskeyRegistration,
  };
}
