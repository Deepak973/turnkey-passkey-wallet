"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { useUser } from "@/hooks/use-user";
import { KeyRound, User, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { Email } from "@/types/turnkey";

const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const AuthForm = ({ onBack }: { onBack: () => void }) => {
  const { user } = useUser();
  const { passkeyClient } = useTurnkey();
  const { state, loginWithPasskey, initEmailLogin } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const router = useRouter();

  const getEmailFromUsername = async (
    username: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/auth/check-username?username=${username}`
      );
      const data = await response.json();

      if (data.exists && data.user?.email) {
        return data.user.email;
      }
      return null;
    } catch (error) {
      console.error("Error getting email from username:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your email or username");
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = isValidEmail(identifier);
      let emailToUse = identifier;

      if (!isEmail) {
        // If username provided, get corresponding email
        const email = await getEmailFromUsername(identifier);
        if (email) {
          emailToUse = email;
        } else {
          toast.error("Please enter a valid email address to continue");
          setIsLoading(false);
          return;
        }
      }

      // Check if user exists using email
      const response = await fetch(`/api/auth/check-email?email=${emailToUse}`);
      const data = await response.json();

      if (data.exists) {
        setShowOptions(true);
      } else {
        // New user with email - proceed with signup
        await initEmailLogin(emailToUse as Email);
        toast.success("Verification email sent!");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async (identifier: string) => {
    if (!passkeyClient) {
      toast.error("Passkey client not initialized");
      return;
    }

    try {
      const isEmail = isValidEmail(identifier);
      let emailToUse = identifier;

      if (!isEmail) {
        const email = await getEmailFromUsername(identifier);
        if (!email) {
          toast.error("Failed to process login");
          return;
        }
        emailToUse = email;
      }
      console.log("emailToUse", emailToUse);
      await loginWithPasskey(emailToUse);
    } catch (error: any) {
      if (error?.message?.includes("User not found")) {
        toast.error(
          "Account not found. Please check your details and try again."
        );
      } else if (error?.message?.includes("No passkey")) {
        toast.error(
          "No passkey found for this account. Please set up a passkey first."
        );
      } else {
        toast.error(error?.message || "Login failed. Please try again.");
      }
      console.error("Handled login error:", error);
    }
  };

  const handleEmailLogin = async (identifier: string) => {
    try {
      const isEmail = isValidEmail(identifier);
      let emailToUse = identifier;

      if (!isEmail) {
        const email = await getEmailFromUsername(identifier);
        if (!email) {
          toast.error("Failed to process login");
          return;
        }
        emailToUse = email;
      }

      await initEmailLogin(emailToUse as Email);
      toast.success("Login email sent!");
    } catch (error) {
      console.error("Email login error:", error);
      toast.error("Failed to send login email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl p-14 bg-black/[4%] rounded-3xl shadow-sm flex flex-col gap-8"
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
              d="M60.711 16.3597C60.711 11.8335 64.3802 8.16426 68.9064 8.16426C73.4326 8.16426 77.1018 11.8335 77.1018 16.3597H85.266C85.266 7.32447 77.9416 0 68.9064 0C59.8712 0 52.5467 7.32447 52.5467 16.3597H60.711ZM52.4866 24.608C57.042 24.608 60.7349 20.9151 60.7349 16.3597H68.8992C68.8992 25.4241 61.551 32.7723 52.4866 32.7723V24.608ZM77.0779 16.3597C77.0779 20.8766 80.7396 24.5383 85.2565 24.5383V32.7025C76.2306 32.7025 68.9136 25.3856 68.9136 16.3597H77.0779ZM118.389 54.2984C120.252 54.2984 121.762 52.7885 121.762 50.926C121.762 49.0634 120.252 47.5536 118.389 47.5536C116.527 47.5536 115.017 49.0634 115.017 50.926C115.017 52.7885 116.527 54.2984 118.389 54.2984ZM115.017 56.2789V79.7117H121.762V56.2789H115.017ZM131.07 63.4862V68.0609C131.085 70.9894 133.348 73.2421 137.258 73.2552L137.236 80C130.609 79.9778 124.356 75.6384 124.325 68.0826L124.325 68.0687V50.5921H131.07V56.7413H137.246V63.4862H131.07ZM40.8535 79.7117V78.6078C39.3721 79.293 37.7219 79.6754 35.9824 79.6754C29.5671 79.6754 24.3664 74.4747 24.3664 68.0594C24.3664 61.6441 29.5671 56.4434 35.9824 56.4434C37.7219 56.4434 39.3721 56.8258 40.8535 57.511V56.2789H47.5984V68.0416L47.5984 68.0594L47.5984 68.0772V79.7117H40.8535ZM40.8535 68.0709V68.0479C40.8473 65.3629 38.6688 63.1883 35.9824 63.1883C33.2921 63.1883 31.1113 65.3691 31.1113 68.0594C31.1113 70.7496 33.2921 72.9305 35.9824 72.9305C38.6688 72.9305 40.8473 70.7559 40.8535 68.0709ZM70.9101 68.0594C70.9101 65.3692 73.091 63.1883 75.7812 63.1883C78.4715 63.1883 80.6524 65.3692 80.6524 68.0594V79.6643H87.3972V68.0594C87.3972 61.6441 82.1966 56.4435 75.7812 56.4435C69.3659 56.4435 64.1653 61.6441 64.1653 68.0594V79.6643H70.9101V68.0594ZM61.5307 63.2045L62.9188 63.1881L62.8391 56.4437L61.4693 56.4599C55.0901 56.4715 49.8418 61.625 49.8418 68.0594V79.6574H56.5866V68.0594C56.5866 65.3955 58.7742 63.2047 61.4909 63.2047H61.5108L61.5307 63.2045ZM16.2459 48.2961L16.1824 48.2963H16.0361V48.2975C7.43355 48.4098 0.494507 55.4183 0.494507 64.0475C0.494507 72.6767 7.43356 79.6852 16.0361 79.7975V79.7989H16.2282L16.2459 79.7989L22.8061 79.7989L22.8061 73.054L16.2313 73.054C12.4559 73.048 9.22519 70.7191 7.89204 67.42H19.5374L19.5374 60.6752L7.89195 60.6752C9.22111 57.3858 12.4367 55.0607 16.1979 55.0411L22.8061 55.0411L22.8061 48.2963L16.2459 48.2963V48.2961ZM89.4709 79.5832V50.1189H96.2157V79.5832H89.4709ZM98.8409 62.916C103.176 59.7548 105.129 54.579 105.159 50.2283L111.904 50.2748C111.868 55.5061 109.877 61.7175 105.229 66.3125L113.6 79.6689H105.64L97.9704 67.4317L96.3012 64.7682L98.8409 62.916Z"
              fill="black"
              fillOpacity="0.4"
            />
          </svg>
        </div>

        {/* Email/Username Input */}
        <div className="bg-black/[10%] rounded-full flex gap-4 px-10 py-5">
          <label
            htmlFor="identifier"
            className="text-[1.375rem] font-funnel-sans text-black/[40%] flex items-center justify-center"
          >
            {isValidEmail(identifier) ? "Email" : "Email/Username"}
          </label>
          <input
            type="text"
            id="identifier"
            placeholder="Username@email.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full bg-transparent outline-none font-funnel-sans text-[1.375rem] ml-4 text-black"
            disabled={showOptions}
          />
        </div>

        {/* Submit Button or Auth Options */}
        {!showOptions ? (
          <button
            type="submit"
            disabled={!identifier.trim() || isLoading}
            className="w-full px-10 py-5 bg-primary font-funnel-sans font-medium text-[1.375rem] text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Submit"}
          </button>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handlePasskeyLogin(identifier)}
              className="w-full px-10 py-5 bg-primary font-funnel-sans font-medium text-[1.375rem] text-white rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound className="h-6 w-6" />
              Continue with Passkey
            </button>
            <button
              type="button"
              onClick={() => handleEmailLogin(identifier)}
              className="w-full px-10 py-5 bg-black/[10%] font-funnel-sans font-medium text-[1.375rem] text-black rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="h-6 w-6" />
              Continue with Email
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOptions(false);
                setIdentifier("");
              }}
              className="w-full px-10 py-5 bg-black/[10%] font-funnel-sans font-medium text-[1.375rem] text-black rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              Try Another Account
            </button>
          </div>
        )}

        {/* More Options Button */}
        <button
          type="button"
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="w-full px-10 py-5 bg-black/[10%] text-gray-700 rounded-full flex items-center justify-between hover:bg-gray-200 transition-colors"
        >
          <span className="font-funnel-sans text-black font-normal text-[1.375rem]">
            More Options
          </span>
          <span>
            <svg
              width="10"
              height="16"
              viewBox="0 0 10 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.904431 15.6187C0.531856 15.277 0.531856 14.723 0.904431 14.3813L7.1875 8.61872C7.56007 8.27701 7.56008 7.72299 7.1875 7.38128L0.904432 1.61872C0.531858 1.27701 0.531858 0.722991 0.904432 0.381281C1.27701 0.0395727 1.88107 0.0395727 2.25364 0.381281L8.53671 6.14385C9.65443 7.16897 9.65443 8.83103 8.53671 9.85615L2.25364 15.6187C1.88107 15.9604 1.277 15.9604 0.904431 15.6187Z"
                fill="black"
              />
            </svg>
          </span>
        </button>
      </form>
    </div>
  );
};
