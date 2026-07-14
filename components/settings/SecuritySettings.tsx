"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("system_role")
          .eq("id", user.id)
          .single();
          
        const profile = data as unknown as { system_role: string } | null;
        if (profile?.system_role === 'owner') {
          setIsOwner(true);
        }
      }
    }
    loadRole();
  }, []);

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

      {isOwner && (
        <div className="rounded-lg border border-[#2a2a2a] bg-zinc-900 overflow-hidden mt-6">
          <div className="border-b border-[#2a2a2a] p-4 flex justify-between items-center">
            <h3 className="font-semibold text-white">Owner Authentication</h3>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-zinc-400">
              Manage your two-step verification factors for secure administrative access.
            </p>
            <Link 
              href="/settings/security/owner"
              className="inline-block rounded bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Manage Owner Authentication
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
