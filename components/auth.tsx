"use client";
import React, { Suspense } from "react";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { Login } from "@/components/login";
import { Signup } from "@/components/signup";
import { ArrowLeft, Mail, UserPlus } from "lucide-react";

export const LoginSignup = () => {
  const [mode, setMode] = useState<"login" | "signup" | null>(null);
  const [isHovered, setIsHovered] = useState<"login" | "signup" | null>(null);

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md transition-all duration-300 hover:shadow-xl">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Welcome to Earnkit
            </h1>
            <p className="mt-2 text-center text-gray-500">
              Choose how you want to continue
            </p>
          </div>

          <div className="p-6 space-y-4">
            <button
              onClick={() => setMode("login")}
              onMouseEnter={() => setIsHovered("login")}
              onMouseLeave={() => setIsHovered(null)}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium transform transition-all duration-300 ${
                isHovered === "login"
                  ? "bg-blue-700 scale-105"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Mail
                className={`mr-2 h-5 w-5 transition-all duration-300 ${
                  isHovered === "login" ? "rotate-12" : ""
                }`}
              />
              Login
            </button>

            <button
              onClick={() => setMode("signup")}
              onMouseEnter={() => setIsHovered("signup")}
              onMouseLeave={() => setIsHovered(null)}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium transform transition-all duration-300 ${
                isHovered === "signup"
                  ? "bg-green-700 scale-105"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <UserPlus
                className={`mr-2 h-5 w-5 transition-all duration-300 ${
                  isHovered === "signup" ? "rotate-12" : ""
                }`}
              />
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <div className="w-full max-w-md bg-white rounded-xl shadow-md transition-all duration-300 hover:shadow-xl">
          <div className="relative p-6">
            <button
              onClick={() => setMode(null)}
              className="absolute left-4 top-4 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-center text-gray-900 pt-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
          </div>
          <div className="p-6">
            {mode === "login" ? (
              <Login onBack={() => setMode(null)} />
            ) : (
              <Signup onBack={() => setMode(null)} />
            )}
          </div>
        </div>
      </Suspense>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default LoginSignup;
