"use client";

import { useActionState, useState, useEffect, Suspense } from "react";
import {
  ownerLoginStep1Action,
  ownerLoginStep2Action,
  type OwnerAuthState,
} from "@/app/actions/owner-login";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout, AuthCard, AuthOtpInput } from "@/components/auth";

function OwnerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStep = searchParams.get("step");

  const [state1, action1, isPending1] = useActionState<OwnerAuthState, FormData>(
    ownerLoginStep1Action,
    { step: 1 }
  );
  const [state2, action2, isPending2] = useActionState<OwnerAuthState, FormData>(
    ownerLoginStep2Action,
    { step: 2 }
  );

  const [currentStep, setCurrentStep] = useState(urlStep === "3" ? 3 : 1);
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // MFA State
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mfaError, setMfaError] = useState("");

  useEffect(() => {
    if (state1.success && state1.step === 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(state1.username || "");
      setCurrentStep(2);
    }
  }, [state1]);

  useEffect(() => {
    if (state2.success && state2.step === 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentStep(3);
    }
  }, [state2]);

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setMfaError("Invalid Authenticator code.");
      return;
    }

    setIsVerifying(true);
    setMfaError("");

    try {
      const supabase = createClient();

      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) throw factorsError;

      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (!totpFactor) {
        setMfaError("Owner access requires two-step verification.");
        setIsVerifying(false);
        return;
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });

      if (challengeError) {
        setMfaError("Authenticator verification expired. Try again.");
        setIsVerifying(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) {
        setMfaError("Invalid Authenticator code.");
        setIsVerifying(false);
        return;
      }

      // Verification successful, redirect
      router.push("/projects");
      router.refresh(); // Refresh to clear any cached states
    } catch (err) {
      console.error(err);
      setMfaError("Owner credentials could not be verified.");
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  // Subtitle per step from prototype
  const subTitle =
    currentStep === 1
      ? "Use the account that owns this workspace."
      : currentStep === 2
      ? "Enter the password for this Owner account."
      : "Open your authenticator app and enter the code it shows for Production OS.";

  const errorMessage =
    currentStep === 1
      ? state1.message
      : currentStep === 2
      ? state2.message
      : mfaError;

  return (
    <AuthLayout>
      <AuthCard
        ownerHeader={{
          step: currentStep,
          totalSteps: 3,
        }}
        title="Owner log in"
        sub={subTitle}
        identity={
          currentStep > 1 && username
            ? {
                name: username,
                onChange: handleBack,
              }
            : undefined
        }
        errorMessage={errorMessage}
      >
        {currentStep === 1 && (
          <form action={action1} className="flex flex-col gap-[22px] m-0">
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
                  defaultValue={state1.username || ""}
                  placeholder="Owner username"
                  autoComplete="username"
                  autoFocus
                  spellCheck={false}
                  disabled={isPending1}
                  className="w-full h-[46px] rounded-[14px] border border-[var(--po-line-2)] bg-[var(--po-card)] text-[var(--po-ink)] text-[15px] pl-[42px] pr-[14px] outline-none transition-[border-color,box-shadow] focus:border-[var(--po-accent)] focus:ring-4 focus:ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)] disabled:bg-[var(--po-sunken)] disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-0.5">
              <Link
                href="/login"
                className="h-[46px] px-4 rounded-full border border-[var(--po-line-2)] bg-transparent text-[var(--po-ink)] font-medium text-[14px] inline-flex items-center gap-2 hover:bg-[var(--po-chip)] transition-colors shrink-0"
              >
                <ArrowLeft size={16} />
                <span>Log in</span>
              </Link>
              <button
                type="submit"
                disabled={isPending1}
                className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-75 disabled:cursor-progress transition-opacity"
              >
                {isPending1 ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Checking…</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form action={action2} className="flex flex-col gap-[22px] m-0">
            <input type="hidden" name="username" value={username} />

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
                  disabled={isPending2}
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

            <div className="flex gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={handleBack}
                disabled={isPending2}
                className="h-[46px] px-4 rounded-full border border-[var(--po-line-2)] bg-transparent text-[var(--po-ink)] font-medium text-[14px] inline-flex items-center gap-2 hover:bg-[var(--po-chip)] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isPending2}
                className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-75 disabled:cursor-progress transition-opacity"
              >
                {isPending2 ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Checking…</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </form>
        )}

        {currentStep === 3 && (
          <form onSubmit={handleMfaVerify} className="flex flex-col gap-[22px] m-0">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mfaCode"
                className="text-[13px] font-medium text-[var(--po-ink)]"
              >
                6-digit authentication code
              </label>
              <AuthOtpInput
                id="mfaCode"
                name="mfaCode"
                value={mfaCode}
                onChange={setMfaCode}
                disabled={isVerifying}
                autoFocus
                error={Boolean(mfaError)}
              />
            </div>

            <div className="flex gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={handleBack}
                disabled={isVerifying}
                className="h-[46px] px-4 rounded-full border border-[var(--po-line-2)] bg-transparent text-[var(--po-ink)] font-medium text-[14px] inline-flex items-center gap-2 hover:bg-[var(--po-chip)] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isVerifying || mfaCode.length !== 6}
                className="flex-1 h-[46px] rounded-full border-0 bg-[var(--po-ink)] text-[var(--po-panel)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-75 disabled:cursor-not-allowed transition-opacity"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify and log in</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--po-bg)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--po-accent)] animate-spin" />
        </div>
      }
    >
      <OwnerLoginContent />
    </Suspense>
  );
}
