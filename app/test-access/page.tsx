"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock } from "lucide-react";

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

      router.push("/production");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify access code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
            <Lock className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Production OS</h2>
          <p className="mt-2 text-sm text-zinc-400">Test Environment</p>
        </div>

        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-4">
          <p className="text-xs text-yellow-500/90 text-center">
            Replace temporary staging access with Production OS Authentication before public production deployment.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-zinc-300">
              Access Code
            </label>
            <div className="mt-2">
              <input
                id="accessCode"
                name="accessCode"
                type="password"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="block w-full rounded-md border-0 bg-zinc-900 py-2.5 px-3.5 text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-800 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 outline-none"
                placeholder="Enter staging access code"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !accessCode}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Verifying..." : "Enter"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
