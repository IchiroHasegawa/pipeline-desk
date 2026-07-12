"use client";

import { useActionState, useState } from "react";
import { signupAction, type AuthState } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(signupAction, {});
  const [showPassword, setShowPassword] = useState(false);

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-[#2a2a2a] bg-[#121212] p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
          <p className="text-zinc-400 text-sm">
            {state.message || "We sent you a confirmation link."}
          </p>
          <div className="pt-4">
            <Link href="/login" className="text-sm font-bold text-white hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-[#2a2a2a] bg-[#121212] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold italic text-black">
            P
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          {state.message && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center">
              {state.message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                pattern="[a-zA-Z0-9_]+"
                minLength={3}
                maxLength={30}
                title="3 to 30 characters. Letters, numbers, and underscores only."
                className="mt-2 block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="letters, numbers, underscores"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 pr-14 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                className="mt-2 block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center rounded bg-blue-600 px-4 py-2 mt-4 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
            </button>

            <div className="text-center text-sm text-zinc-400 pt-2">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-white hover:underline">
                Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
