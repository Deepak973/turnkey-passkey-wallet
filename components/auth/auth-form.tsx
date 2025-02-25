"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
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
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isUsernameNotFound, setIsUsernameNotFound] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    const qsError = searchParams.get("error");
    if (qsError) {
      toast.error(qsError);
    }
  }, [searchParams]);

  const handleContinue = async () => {
    if (!identifier.trim()) {
      toast.error("Please enter your email or username");
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = isValidEmail(identifier);

      // Check if user exists
      const response = await fetch(
        `/api/auth/check-${isEmail ? "email" : "username"}?${
          isEmail ? "email" : "username"
        }=${identifier}`
      );
      const data = await response.json();

      if (data.exists) {
        setIsExistingUser(true);
        setUserDetails(data.user);
        setShowOptions(true);
        setIsUsernameNotFound(false);
      } else {
        if (!isEmail) {
          // Username not found, ask for email
          setIsUsernameNotFound(true);
          setIdentifier("");
          toast.error(
            "Username not found. Please enter your email address to continue"
          );
        } else {
          // New user with email - proceed with signup
          await initEmailLogin(identifier as Email);
          toast.success("Verification email sent!");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      const isEmail = isValidEmail(identifier);
      let emailToUse = identifier;

      if (!isEmail) {
        // If username provided, get email from user details
        const response = await fetch(
          `/api/auth/check-username?username=${identifier}`
        );
        const data = await response.json();
        if (data.exists && data.user.email) {
          emailToUse = data.user.email;
        } else {
          toast.error("Could not find email for this username");
          return;
        }
      }

      await initEmailLogin(emailToUse as Email);
      toast.success("Login email sent!");
    } catch (error) {
      console.error("Email login error:", error);
      toast.error("Failed to send login email");
    }
  };

  const handlePasskeyLogin = async () => {
    if (!passkeyClient) {
      toast.error("Passkey client not initialized");
      return;
    }

    try {
      const isEmail = isValidEmail(identifier);
      let usernameToUse = identifier;

      if (isEmail) {
        // If email provided, get username from user details
        const response = await fetch(
          `/api/auth/check-email?email=${identifier}`
        );
        const data = await response.json();
        if (data.exists && data.user.username) {
          usernameToUse = data.user.username;
        } else {
          toast.error("Could not find username for this email");
          return;
        }
      }

      await loginWithPasskey(usernameToUse);
    } catch (error: any) {
      if (error?.message?.includes("User not found")) {
        toast.error(
          "Username not found. Please check your username and try again."
        );
      } else if (error?.message?.includes("No passkey")) {
        toast.error(
          "No passkey found for this user. Please set up a passkey first."
        );
      } else {
        toast.error(error?.message || "Login failed. Please try again.");
      }
      console.error("Handled login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-300 rounded-2xl shadow-2xl">
        <h1 className="text-xl font-semibold text-center text-gray-900">
          {isExistingUser ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-sm text-center text-gray-500 mt-1">
          {isExistingUser
            ? "Login to your account"
            : "Sign up for a new account"}
        </p>

        <div className="mt-6">
          <label
            htmlFor="auth-identifier"
            className="block text-sm font-medium text-gray-700"
          >
            {isUsernameNotFound ? "Email Address" : "Email or Username"}
          </label>
          {isUsernameNotFound && (
            <p className="text-sm text-gray-500 mt-1">
              This username is not registered. Please enter your email address
              to continue.
            </p>
          )}
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="auth-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all border-gray-300 focus:ring-blue-500"
              placeholder={
                isUsernameNotFound
                  ? "Enter your email address"
                  : "Enter your email or username"
              }
              disabled={showOptions}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {!showOptions ? (
            <>
              <Button
                onClick={handleContinue}
                disabled={!identifier.trim() || isLoading || state.loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
              {isUsernameNotFound && (
                <Button
                  onClick={() => {
                    setIsUsernameNotFound(false);
                    setIdentifier("");
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Try Different Username
                </Button>
              )}
            </>
          ) : (
            <>
              {userDetails?.hasPasskey && (
                <Button
                  onClick={handlePasskeyLogin}
                  disabled={state.loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <KeyRound className="h-5 w-5" />
                  Continue with Passkey
                </Button>
              )}
              <Button
                onClick={handleEmailLogin}
                disabled={state.loading}
                variant={userDetails?.hasPasskey ? "outline" : "default"}
                className="w-full flex items-center justify-center gap-2"
              >
                <Mail className="h-5 w-5" />
                Continue with Email
              </Button>
              <Button
                onClick={() => {
                  setShowOptions(false);
                  setIdentifier("");
                  setIsExistingUser(false);
                  setUserDetails(null);
                }}
                variant="ghost"
                className="w-full"
              >
                Try Another Account
              </Button>
            </>
          )}

          <Button onClick={onBack} variant="outline" className="w-full">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};
