"use client";
import { useState } from "react";
import { AuthForm } from "./auth-form";

export const Auth = () => {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md p-8 bg-white border border-gray-300 rounded-2xl shadow-2xl">
          <h1 className="text-xl font-semibold text-center text-gray-900">
            Welcome to App
          </h1>
          <div className="mt-6 space-y-4">
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 text-white py-2 rounded-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AuthForm onBack={() => setShowForm(false)} />;
};
