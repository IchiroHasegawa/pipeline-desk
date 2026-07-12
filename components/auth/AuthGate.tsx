"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type AuthGateProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export default function AuthGate({
  children,
  title = "Sign in to Production OS",
  description = "Assets use authenticated Supabase policies, so sign in before managing production assets.",
}: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function loadSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);
      setIsLoading(false);
    }

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    const response =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

    setIsSubmitting(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    if (response.data.session) {
      setSession(response.data.session);
      setMessage(null);
      return;
    }

    setMessage(
      "Account created. If email confirmation is enabled in Supabase, confirm your email before signing in."
    );
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center bg-black text-sm text-zinc-400">
        Checking Supabase session...
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center bg-black px-4 text-white">
        <section className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#121212] p-6 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{description}</p>
          </div>

          <div className="mb-5 flex rounded border border-[#2a2a2a] bg-black p-1 text-xs font-bold uppercase text-zinc-400">
            <button
              type="button"
              onClick={() => {
                setMode("sign-in");
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 rounded px-3 py-2 transition-colors ${
                mode === "sign-in" ? "bg-white text-black" : "hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("sign-up");
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 rounded px-3 py-2 transition-colors ${
                mode === "sign-up" ? "bg-white text-black" : "hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded border border-blue-500/40 bg-blue-500/10 p-3 text-sm text-blue-100">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "sign-in"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2 text-xs text-zinc-400">
        <span>
          Signed in as <span className="text-zinc-200">{session.user.email}</span>
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1 rounded border border-[#2a2a2a] bg-zinc-900 px-2 py-1 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <LogOut className="h-3 w-3" />
          Sign Out
        </button>
      </div>
      {children}
    </>
  );
}

