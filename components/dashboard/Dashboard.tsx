"use client";
import { useAuth } from "@/providers/auth-provider";

export function Dashboard() {
  const { logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, !</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
        {/* Add dashboard content here */}
      </div>
    </div>
  );
}
