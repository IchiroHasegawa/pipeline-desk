// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
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
    <div className="space-y-6 max-w-[760px]">
      <div>
        <h2 className="text-xl font-bold text-[var(--po-ink)]">Security Settings</h2>
        <p className="mt-1 text-sm text-[var(--po-ink-2)]">Manage access and authentication</p>
      </div>

      <div className="rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-sm)] overflow-hidden">
        <div className="border-b border-[var(--po-line)] p-5">
          <h3 className="font-semibold text-[var(--po-ink)]">Staging Environment</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--po-ink-2)] leading-relaxed">
            If you are currently in a staging session, you can exit the test session and clear your access token.
          </p>
          <button 
            onClick={handleExitStaging}
            disabled={isLoading}
            className="rounded-full bg-[#E5534B] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Exiting..." : "Exit Test Session"}
          </button>
        </div>
      </div>

      {isOwner && (
        <div className="rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-sm)] overflow-hidden mt-6">
          <div className="border-b border-[var(--po-line)] p-5 flex justify-between items-center">
            <h3 className="font-semibold text-[var(--po-ink)] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--po-accent)]" />
              Owner Authentication
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--po-ink-2)] leading-relaxed">
              Manage your two-step verification factors for secure administrative access.
            </p>
            <Link 
              href="/settings/security/owner"
              className="inline-block rounded-full border border-[var(--po-line-2)] bg-transparent px-5 py-2 text-sm font-semibold text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)]"
            >
              Manage Owner Authentication
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
