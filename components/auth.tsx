"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { Email } from "@/types/turnkey";
import { Button } from "@/components/ui/button";
import { KeyRound, Mail } from "lucide-react";

const AuthContent = () => {
  const { user } = useUser();
  const { passkeyClient } = useTurnkey();
  const { initEmailLogin, state, loginWithPasskey } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);
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

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(regex.test(email));
    return regex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
  };

  const handlePasskeyLogin = async () => {
    if (!validateEmail(email)) return;
    setLoadingAction("passkey");
    if (!passkeyClient) {
      toast.error("Passkey client not initialized");
      setLoadingAction(null);
      return;
    }
    try {
      await loginWithPasskey(email as Email);
    } catch (error) {
      toast.error("Failed to login with passkey");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailLogin = async () => {
    if (!validateEmail(email)) return;
    setLoadingAction("email");
    await initEmailLogin(email as Email);
    setLoadingAction(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-300 rounded-2xl shadow-2xl">
        <h1 className="text-xl font-semibold text-center text-gray-900">
          Welcome back
        </h1>
        <div className="bg-red-500 text-white p-4">Tailwind is working</div>

        <p className="text-sm text-center text-gray-500 mt-1">
          Sign in to your account to continue
        </p>
        <div className="mt-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                !isValid && email
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="name@company.com"
            />
          </div>
          {!isValid && email && (
            <p className="text-sm text-red-600">
              Please enter a valid email address
            </p>
          )}
        </div>
        <div className="mt-6 space-y-3">
          <Button
            onClick={handlePasskeyLogin}
            disabled={!isValid || state.loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            <KeyRound className="h-5 w-5 inline mr-2" /> Continue with Passkey
          </Button>
          <Button
            onClick={handleEmailLogin}
            disabled={!isValid || state.loading}
            variant="outline"
            className="w-full border-gray-300 py-2 rounded-md"
          >
            <Mail className="h-5 w-5 inline mr-2" /> Continue with Email
          </Button>
        </div>
        <p className="text-sm text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default function Auth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
