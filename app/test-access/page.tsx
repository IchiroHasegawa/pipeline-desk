"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { AuthLayout, AuthCard } from "@/components/auth";

export default function TestAccessPage() {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/staging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid access code");
      }

      router.push("/projects");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to verify access code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout isStaging={true}>
      <AuthCard
        title="Staging access"
        sub="This is a pre-release build. Enter the access code from your team to continue."
        errorMessage={error}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-[22px] m-0">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="accessCode"
              className="text-[13px] font-medium text-[var(--po-ink)]"
            >
              Access code
            </label>
            <div className="relative flex items-center">
              <KeyRound
                size={16}
                className="absolute left-[15px] text-[var(--po-ink-3)] pointer-events-none"
              />
              <input
                id="accessCode"
                name="accessCode"
                type="password"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                autoFocus
                disabled={isLoading}
                className="w-full h-[46px] rounded-[14px] border border-[var(--po-line-2)] bg-[var(--po-card)] text-[var(--po-ink)] font-mono text-[15px] tracking-wider pl-[42px] pr-[14px] outline-none transition-[border-color,box-shadow] focus:border-[var(--po-accent)] focus:ring-4 focus:ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)] disabled:bg-[var(--po-sunken)] disabled:opacity-60"
              />
            </div>
            <span className="text-[12.5px] text-[var(--po-ink-3)]">
              Ask your producer for this build’s code.
            </span>
          </div>

          <div className="flex gap-2.5 pt-0.5">
            <button
              type="submit"
              disabled={isLoading || !accessCode}
              className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-75 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Checking…</span>
                </>
              ) : (
                <span>Enter</span>
              )}
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
