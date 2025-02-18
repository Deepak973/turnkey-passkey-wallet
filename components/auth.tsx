"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";

import { useUser } from "@/hooks/use-user";
import { Email } from "@/types/turnkey";
import { Button } from "@/components/ui/button";
import { KeyRound, Mail, User } from "lucide-react";
import { checkEmailExists, checkUsernameExists } from "@/actions/turnkey";
import { ToastContainer, toast } from "react-toastify";

type Step = "email" | "username" | "login";

const AuthContent = () => {
  const { user } = useUser();
  const { passkeyClient } = useTurnkey();
  const { state, loginWithPasskey, signupWithPasskey } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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

  const validateEmail = async (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(regex.test(email));

    return regex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    const emailExists = await checkEmailExists(email as Email);
    console.log("emailExists", emailExists);
    if (emailExists) {
      setStep("login");
    } else {
      setStep("username");
    }
  };

  const handleLoginWithPasskey = async () => {
    setLoadingAction("passkey");
    if (!passkeyClient) {
      toast.error("Passkey client not initialized");
      setLoadingAction(null);
      return;
    }
    try {
      await loginWithPasskey(username as string);
    } catch (error) {
      toast.error("Incorrect username");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!validateEmail(email)) return;
    setLoadingAction("passkey");
    if (!passkeyClient) {
      toast.error("Passkey client not initialized");
      setLoadingAction(null);
      return;
    }
    const usernameExists = await checkUsernameExists(username as string);
    if (usernameExists) {
      toast.error("Username already exists in Earnkit");
      setLoadingAction(null);
      return;
    }
    console.log("usernameExists", usernameExists);
    try {
      await signupWithPasskey(email as Email, username as string);
    } catch (error) {
      toast.error("Failed to login with passkey");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-300 rounded-2xl shadow-2xl">
        <h1 className="text-xl font-semibold text-center text-gray-900">
          {step === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-sm text-center text-gray-500 mt-1">
          {step === "login"
            ? "Login to your account"
            : "Sign up for a new account"}
        </p>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit}>
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
            <div className="mt-6">
              <Button
                type="submit"
                disabled={!isValid || state.loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md"
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {step === "username" && (
          <div className="mt-6">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all border-gray-300 focus:ring-blue-500"
                placeholder="Choose a username"
              />
            </div>
            <div className="mt-6">
              <Button
                onClick={handlePasskeyLogin}
                disabled={!username || state.loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md"
              >
                <KeyRound className="h-5 w-5 inline mr-2" /> Continue with
                Passkey
              </Button>
            </div>
          </div>
        )}

        {step === "login" && (
          <div className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Logging in with email:{" "}
                <span className="font-medium">{email}</span>
              </p>
            </div>
            <div className="mb-4">
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
            <Button
              onClick={handleLoginWithPasskey}
              disabled={!username || state.loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md"
            >
              <KeyRound className="h-5 w-5 inline mr-2" />
              Login with Passkey
            </Button>
            <button
              onClick={() => {
                setStep("email");
                setUsername("");
              }}
              className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* <p className="text-sm text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700">
            Sign up
          </a>
        </p> */}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
