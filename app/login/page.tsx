"use client";

import { useActionState, useState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";
import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { AuthLayout, AuthCard } from "@/components/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    loginAction,
    { step: 1 }
  );
  const [showPassword, setShowPassword] = useState(false);

  const isStep1 = state.step === 1;

  return (
    <AuthLayout>
      <AuthCard
        title={isStep1 ? "Log in" : "Enter your password"}
        sub={
          isStep1
            ? "Welcome back. Start with your username."
            : "Logging in to your Production OS workspace."
        }
        identity={
          !isStep1 && state.username
            ? {
                name: state.username,
                onChange: () => {
                  window.location.href = "/login";
                },
              }
            : undefined
        }
        errorMessage={state.message}
        footer={
          <div className="flex items-center gap-1.5">
            <span>New to Production OS?</span>
            <Link
              href="/signup"
              className="font-semibold text-[var(--po-accent)] hover:underline"
            >
              Create account
            </Link>
          </div>
        }
        secondaryLink={
          isStep1 ? (
            <Link
              href="/owner-login"
              className="inline-flex items-center gap-2 h-[34px] px-3.5 rounded-full border border-[var(--po-line)] bg-[var(--po-panel)] text-[var(--po-ink-2)] text-[13px] font-medium hover:text-[var(--po-ink)] hover:bg-[var(--po-card)] transition-colors shadow-xs"
            >
              <ShieldCheck size={14} />
              <span>Owner access</span>
              <ChevronRight size={14} className="text-[var(--po-ink-3)]" />
            </Link>
          ) : undefined
        }
      >
        <form action={formAction} className="flex flex-col gap-[22px] m-0">
          <input type="hidden" name="step" value={state.step} />

          {isStep1 ? (
            <>
              {/* Step 1: Username Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="username"
                  className="text-[13px] font-medium text-[var(--po-ink)]"
                >
                  Username
                </label>
                <div className="relative flex items-center">
                  <AtSign
                    size={16}
                    className="absolute left-[15px] text-[var(--po-ink-3)] pointer-events-none"
                  />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    defaultValue={state.username || ""}
                    placeholder="e.g. ana_lindqvist"
                    autoComplete="username"
                    autoFocus
                    spellCheck={false}
                    disabled={isPending}
                    className="w-full h-[46px] rounded-[14px] border border-[var(--po-line-2)] bg-[var(--po-card)] text-[var(--po-ink)] text-[15px] pl-[42px] pr-[14px] outline-none transition-[border-color,box-shadow] focus:border-[var(--po-accent)] focus:ring-4 focus:ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)] disabled:bg-[var(--po-sunken)] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2.5 pt-0.5">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-75 disabled:cursor-progress transition-opacity"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Checking…</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Password Field */}
              <input type="hidden" name="username" value={state.username || ""} />

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="text-[13px] font-medium text-[var(--po-ink)]"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock
                    size={16}
                    className="absolute left-[15px] text-[var(--po-ink-3)] pointer-events-none"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    autoFocus
                    disabled={isPending}
                    className="w-full h-[46px] rounded-[14px] border border-[var(--po-line-2)] bg-[var(--po-card)] text-[var(--po-ink)] text-[15px] pl-[42px] pr-[46px] outline-none transition-[border-color,box-shadow] focus:border-[var(--po-accent)] focus:ring-4 focus:ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)] disabled:bg-[var(--po-sunken)] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 w-[34px] h-[34px] rounded-[10px] text-[var(--po-ink-3)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] flex items-center justify-center p-0 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-0.5">
                <Link
                  href="/login"
                  className="h-[46px] px-4 rounded-full border border-[var(--po-line-2)] bg-transparent text-[var(--po-ink)] font-medium text-[14px] inline-flex items-center gap-2 hover:bg-[var(--po-chip)] transition-colors shrink-0"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-75 disabled:cursor-progress transition-opacity"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Logging in…</span>
                    </>
                  ) : (
                    <span>Log in</span>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
