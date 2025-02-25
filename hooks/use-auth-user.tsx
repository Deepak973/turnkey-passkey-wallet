import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie, COOKIE_KEYS } from "@/utils/cookies";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  organizationId: string;
  organizationName: string;
  walletAddress: string;
  userId: string;
  hasPasskey: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useAuthUser = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userEmail = getCookie(COOKIE_KEYS.USER_EMAIL);

        if (!userEmail) {
          setLoading(false);
          //   router.push("/");
          return;
        }

        const response = await fetch(
          `/api/auth/get-user-details?userEmail=${userEmail}`
        );
        const data = await response.json();

        if (data.success) {
          setUser(data.user);
        } else {
          // Handle error - maybe remove cookie and redirect to login
          console.error("Failed to fetch user details:", data.message);
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  return { user, loading };
};
