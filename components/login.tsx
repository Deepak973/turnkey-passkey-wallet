"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { KeyRound, User } from "lucide-react";
import { toast } from "react-toastify";

export const Login = ({ onBack }: { onBack: () => void }) => {
  const { user } = useUser();
  const { passkeyClient } = useTurnkey();
  const { state, loginWithPasskey } = useAuth();
  const [username, setUsername] = useState("");
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

  const handleLoginWithPasskey = async () => {
    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }

    if (!passkeyClient) {
      toast.error("Passkey client not initialized");
      return;
    }

    try {
      await loginWithPasskey(username);
    } catch (error: any) {
      // Handle specific error messages
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
          Welcome Back
        </h1>
        <p className="text-sm text-center text-gray-500 mt-1">
          Login to your account
        </p>

        <div className="mt-6">
          <label
            htmlFor="login-username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all border-gray-300 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Button
            onClick={handleLoginWithPasskey}
            disabled={!username || state.loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            <KeyRound className="h-5 w-5 inline mr-2" />
            Login with Passkey
          </Button>

          <Button onClick={onBack} variant="outline" className="w-full">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};
