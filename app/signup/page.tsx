"use client";

import { useActionState, useState } from "react";
import { signupAction, type AuthState } from "@/app/actions/auth";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
} from "lucide-react";
import { AuthLayout, AuthCard } from "@/components/auth";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signupAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordsMismatch =
    confirmTouched &&
    confirmPassword.length > 0 &&
    password.length > 0 &&
    password !== confirmPassword;

  if (state.success) {
    return (
      <AuthLayout>
        <AuthCard
          heroIcon={<MailCheck size={28} />}
          title="Check your email"
          sub="We sent a confirmation link to your email address. Open it to activate your account, then log in."
        >
          <div className="flex gap-2.5 pt-2">
            <Link
              href="/login"
              className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={16} />
              <span>Back to log in</span>
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Create account"
        sub="Join your studio’s Production OS workspace."
        errorMessage={state.message}
        footer={
          <div className="flex items-center gap-1.5">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="font-semibold text-[var(--po-accent)] hover:underline"
            >
              Log in
            </Link>
          </div>
        }
      >
        <form action={formAction} className="flex flex-col gap-[22px] m-0">
          <div className="flex flex-col gap-4">
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
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
                  pattern="[a-zA-Z0-9_]+"
                  minLength={3}
                  maxLength={30}
                  placeholder="e.g. ana_lindqvist"
                  autoComplete="username"
                  autoFocus
                  spellCheck={false}
                  disabled={isPending}
                  className="w-full h-[46px] rounded-[14px] border border-[var(--po-line-2)] bg-[var(--po-card)] text-[var(--po-ink)] text-[15px] pl-[42px] pr-[14px] outline-none transition-[border-color,box-shadow] focus:border-[var(--po-accent)] focus:ring-4 focus:ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)] disabled:bg-[var(--po-sunken)] disabled:opacity-60"
                />
              </div>
              <span className="text-[12.5px] text-[var(--po-ink-3)]">
                3–30 letters, numbers or underscores
              </span>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-[13px] font-medium text-[var(--po-ink)]"
              >
                Email
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  className="absolute left-[15px] text-[var(--po-ink-3)] pointer-events-none"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@studio.com"
                  autoComplete="email"
                  spellCheck={false}
                  disabled={isPending}
                  className="w-full h-[46px] rounded-[14px] border border-[var(--po-line-2)] bg-[var(--po-card)] text-[var(--po-ink)] text-[15px] pl-[42px] pr-[14px] outline-none transition-[border-color,box-shadow] focus:border-[var(--po-accent)] focus:ring-4 focus:ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)] disabled:bg-[var(--po-sunken)] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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
              <span className="text-[12.5px] text-[var(--po-ink-3)]">
                At least 8 characters
              </span>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-[13px] font-medium text-[var(--po-ink)]"
              >
                Confirm password
              </label>
              <div className="relative flex items-center">
                <Lock
                  size={16}
                  className="absolute left-[15px] text-[var(--po-ink-3)] pointer-events-none"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmTouched(true);
                  }}
                  onBlur={() => setConfirmTouched(true)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={isPending}
                  className={`w-full h-[46px] rounded-[14px] border bg-[var(--po-card)] text-[var(--po-ink)] text-[15px] pl-[42px] pr-[46px] outline-none transition-[border-color,box-shadow] focus:ring-4 disabled:bg-[var(--po-sunken)] disabled:opacity-60 ${
                    passwordsMismatch
                      ? "border-[var(--po-danger)] ring-4 ring-[color-mix(in_oklch,var(--po-danger)_14%,transparent)]"
                      : "border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-1.5 w-[34px] h-[34px] rounded-[10px] text-[var(--po-ink-3)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] flex items-center justify-center p-0 transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordsMismatch && (
                <span className="flex items-center gap-1.5 text-[12.5px] text-[var(--po-danger)] font-medium">
                  <AlertCircle size={13} />
                  Passwords do not match
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-75 disabled:cursor-progress transition-opacity"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
