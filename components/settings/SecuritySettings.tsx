"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleExitStaging = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/staging/exit", { method: "POST" });
      router.push("/test-access");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white">Security Settings</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage access and authentication</p>
      </div>

      <div className="rounded-lg border border-[#2a2a2a] bg-zinc-900 overflow-hidden">
        <div className="border-b border-[#2a2a2a] p-4">
          <h3 className="font-semibold text-white">Staging Environment</h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-zinc-400">
            If you are currently in a staging session, you can exit the test session and clear your access token.
          </p>
          <button 
            onClick={handleExitStaging}
            disabled={isLoading}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {isLoading ? "Exiting..." : "Exit Test Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
