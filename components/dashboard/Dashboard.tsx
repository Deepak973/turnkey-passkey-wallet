"use client";
import ActivityCard from "../transactionActivity/activityCard";
import FundsCard from "../walletfunds/fundCard";

export function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>

        <FundsCard />

        <ActivityCard />
      </div>
    </div>
  );
}
