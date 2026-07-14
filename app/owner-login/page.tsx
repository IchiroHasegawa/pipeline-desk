"use client";

import { useActionState, useState, useEffect, useRef, Suspense } from "react";
import { ownerLoginStep1Action, ownerLoginStep2Action, type OwnerAuthState } from "@/app/actions/owner-login";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function OwnerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStep = searchParams.get("step");
  
  const [state1, action1, isPending1] = useActionState<OwnerAuthState, FormData>(ownerLoginStep1Action, { step: 1 });
  const [state2, action2, isPending2] = useActionState<OwnerAuthState, FormData>(ownerLoginStep2Action, { step: 2 });
  
  const [currentStep, setCurrentStep] = useState(urlStep === "3" ? 3 : 1);
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // MFA State
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state1.success && state1.step === 2) {
      setUsername(state1.username || "");
      setCurrentStep(2);
    }
  }, [state1]);

  useEffect(() => {
    if (state2.success && state2.step === 3) {
      setCurrentStep(3);
    }
  }, [state2]);

  // Focus input on step 3
  useEffect(() => {
    if (currentStep === 3) {
      inputRef.current?.focus();
    }
  }, [currentStep]);

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
      
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;
      
      const totpFactor = factors?.totp?.find(f => f.status === 'verified');
      
      if (!totpFactor) {
        setMfaError("Owner access requires two-step verification.");
        setIsVerifying(false);
        return;
      }
      
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });
      
      if (challengeError) {
        setMfaError("Authenticator verification expired. Try again.");
        setIsVerifying(false);
        return;
      }
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: mfaCode
      });
      
      if (verifyError) {
        setMfaError("Invalid Authenticator code.");
        setIsVerifying(false);
        return;
      }
      
      // Verification successful, redirect
      router.push("/production");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-[#2a2a2a] bg-[#121212] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Owner Access</h2>
        </div>

        {currentStep === 1 && (
          <form action={action1} className="mt-8 space-y-6">
            {state1.message && (
              <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center">
                {state1.message}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
                  Owner Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  defaultValue={state1.username || ""}
                  className="mt-2 block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              <button
                type="submit"
                disabled={isPending1}
                className="flex w-full justify-center rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
              >
                {isPending1 ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form action={action2} className="mt-8 space-y-6">
            {state2.message && (
              <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center">
                {state2.message}
              </div>
            )}

            <div className="space-y-4">
              <input type="hidden" name="username" value={username} />
              
              <div className="flex items-center justify-between rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-sm">
                <div>
                  <span className="text-zinc-500">Signing in as </span>
                  <span className="font-bold text-white">{username}</span>
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex w-1/3 justify-center rounded border border-[#2a2a2a] bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isPending2}
                  className="flex w-2/3 justify-center rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
                >
                  {isPending2 ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                </button>
              </div>
            </div>
          </form>
        )}

        {currentStep === 3 && (
          <form onSubmit={handleMfaVerify} className="mt-8 space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white">Two-Step Verification</h3>
            </div>
            
            {mfaError && (
              <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-center">
                {mfaError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-zinc-300">
                  Authenticator Code
                </label>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  ref={inputRef}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="mt-2 block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-[0.5em] text-lg font-mono"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex w-1/3 justify-center rounded border border-[#2a2a2a] bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || mfaCode.length !== 6}
                  className="flex w-2/3 justify-center rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify and Enter"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#00e5ff] animate-spin" /></div>}>
      <OwnerLoginContent />
    </Suspense>
  );
}
