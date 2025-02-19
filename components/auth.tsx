"use client";
import React, { Suspense } from "react";
import { useState } from "react";
import { Button } from "./ui/button";
import { ToastContainer } from "react-toastify";
import { Login } from "@/components/login";
import { Signup } from "@/components/signup";

export const LoginSignup = () => {
  const [mode, setMode] = useState<"login" | "signup" | null>(null);

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md p-8 bg-white border border-gray-300 rounded-2xl shadow-2xl">
          <h1 className="text-xl font-semibold text-center text-gray-900 mb-6">
            Welcome to Earnkit
          </h1>
          <div className="space-y-4">
            <Button
              onClick={() => setMode("login")}
              className="w-full bg-blue-600"
            >
              Login
            </Button>
            <Button
              onClick={() => setMode("signup")}
              className="w-full bg-green-600"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {mode === "login" ? (
        <Login onBack={() => setMode(null)} />
      ) : (
        <Signup onBack={() => setMode(null)} />
      )}
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
    </Suspense>
  );
};
