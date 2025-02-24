"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTurnkey } from "@turnkey/sdk-react";
import { Loader } from "lucide-react";
// import { Icons } from "@/components/icons";

function EmailAuthContent() {
  const searchParams = useSearchParams();
  const { completeEmailAuth } = useAuth();
  const { authIframeClient } = useTurnkey();
  const userEmail = searchParams.get("userEmail");
  const continueWith = searchParams.get("continueWith");
  const credentialBundle = searchParams.get("credentialBundle");

  useEffect(() => {
    if (authIframeClient && userEmail && continueWith && credentialBundle) {
      completeEmailAuth({ userEmail, continueWith, credentialBundle });
    }
  }, [authIframeClient]);

  return (
    <main className="flex w-full flex-col items-center justify-center min-h-screen p-4">
      <div className="mx-auto w-full sm:w-1/2 bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-6">
        <div className="space-y-4 text-center">
          {/* <Icons.turnkey className="h-12 w-full stroke-0 py-2 dark:stroke-white sm:h-14" /> */}
          <h2 className="text-lg font-semibold flex items-center justify-center">
            {credentialBundle ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                <span className="text-base">Authenticating...</span>
              </div>
            ) : (
              <span>Confirm your email</span>
            )}
          </h2>
          {!credentialBundle && (
            <p className="text-gray-600 dark:text-gray-400">
              Click the link sent to{" "}
              <span className="font-bold">{userEmail}</span> to sign in.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function EmailAuth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailAuthContent />
    </Suspense>
  );
}
