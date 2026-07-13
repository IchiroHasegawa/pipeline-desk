"use client";

import { useActionState, useState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(loginAction, { step: 1 });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-[#2a2a2a] bg-[#121212] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold italic text-black">
            P
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in to Production OS</h2>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          <input type="hidden" name="step" value={state.step} />
          
          {state.message && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center">
              {state.message}
            </div>
          )}

          {state.step === 1 ? (
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
                  defaultValue={state.username || ""}
                  className="mt-2 block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
              </button>

              <div className="text-center text-sm text-zinc-400">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-bold text-white hover:underline">
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="hidden" name="username" value={state.username || ""} />
              
              <div className="flex items-center justify-between rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-sm">
                <div>
                  <span className="text-zinc-500">Signing in as </span>
                  <span className="font-bold text-white">{state.username}</span>
                </div>
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              <div className="flex justify-end">
                <a href="#" className="text-xs font-medium text-zinc-400 hover:text-white">
                  Forgot Password?
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <Link
                  href="/login"
                  className="flex w-1/3 justify-center rounded border border-[#2a2a2a] bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                >
                  Back
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-2/3 justify-center rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
