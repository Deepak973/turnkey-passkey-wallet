"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { useUser } from "@/hooks/use-user";
import { Email } from "@/types/turnkey";
import { Button } from "@/components/ui/button";
import { KeyRound, Mail, User } from "lucide-react";
import { checkEmailExists, checkUsernameExists } from "@/actions/turnkey";
import { toast } from "react-toastify";

type Step = "email" | "username";

export const Signup = ({ onBack }: { onBack: () => void }) => {
  const { user } = useUser();
  const { passkeyClient } = useTurnkey();
  const { state, signupWithPasskey, initEmailLogin } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = regex.test(email);
    setIsValid(isValidEmail);
    return isValidEmail;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    try {
      const emailExists = await checkEmailExists(email as Email);
      if (emailExists) {
        toast.info("Email already exists. Please login instead.");
        // router.push("/login");
        return;
      }
      setStep("username");
    } catch (error) {
      toast.error("Error checking email");
    }
  };

  const handleEmailLogin = async (email: Email) => {
    await initEmailLogin(email);
  };

  const handleSignup = async () => {
    if (!validateEmail(email)) return;
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (!passkeyClient) {
      toast.error("Passkey client not initialized");
      return;
    }

    try {
      await signupWithPasskey(email as Email, username);
    } catch (error) {
      toast.error("Signup failed" + error);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-300 rounded-2xl shadow-2xl">
        <h1 className="text-xl font-semibold text-center text-gray-900">
          Create Account
        </h1>
        <p className="text-sm text-center text-gray-500 mt-1">
          Sign up for a new account
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
            <Button
              type="button"
              variant="outline"
              className="w-full font-semibold"
              disabled={!isValid}
              onClick={() => handleEmailLogin(email as Email)}
            >
              Continue with email
            </Button>
            <div className="mt-6 space-y-4">
              <Button
                type="submit"
                disabled={!isValid || state.loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md"
              >
                Continue
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                Back
              </Button>
            </div>
          </form>
        )}

        {step === "username" && (
          <div className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Email: <span className="font-medium">{email}</span>
              </p>
            </div>
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
            <div className="mt-6 space-y-4">
              <Button
                onClick={handleSignup}
                disabled={!username || state.loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md"
              >
                <KeyRound className="h-5 w-5 inline mr-2" /> Continue with
                Passkey
              </Button>
              <Button
                onClick={() => setStep("email")}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
