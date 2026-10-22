"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Factor } from "@supabase/supabase-js";
import { Loader2, ShieldAlert, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/app-shell/ConfirmDialog";

export default function OwnerAuthSettings() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Enrollment State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Unenroll State
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [factorToRemove, setFactorToRemove] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadFactors();
  }, []);

  async function loadFactors() {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data?.totp) {
      setFactors(data.totp.filter((f) => f.status === "verified"));
    }
    setIsLoading(false);
  }

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setEnrollError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Production OS",
        friendlyName: "Production OS Owner",
      });

      if (error) throw error;

      setEnrollData({
        id: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "Failed to start enrollment.");
    }
    setIsEnrolling(false);
  };

  const handleVerify = async () => {
    if (!enrollData || verifyCode.length !== 6) return;
    setIsVerifying(true);
    setEnrollError("");

    try {
      const supabase = createClient();

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // Success!
      setEnrollData(null);
      setVerifyCode("");
      await loadFactors();
      router.refresh();
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "Invalid verification code.");
    }
    setIsVerifying(false);
  };

  const handleRemoveClick = (factorId: string) => {
    setFactorToRemove(factorId);
  };

  const executeRemove = async (factorId: string) => {
    setIsRemoving(factorId);
    setRemoveError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        throw error;
      }

      await loadFactors();
    } catch (err) {
      setRemoveError(
        err instanceof Error
          ? err.message
          : "Failed to remove authenticator. You may need to log in again to verify a recent AAL2 session."
      );
    }
    setIsRemoving(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-[20px] font-semibold text-[var(--po-ink)]">Owner Authentication</h2>
        <p className="mt-1 text-[13px] text-[var(--po-ink-2)]">Manage two-step verification</p>
      </div>

      <div className="rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-sm)] overflow-hidden">
        <div className="border-b border-[var(--po-line)] p-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[var(--po-ink)]" />
          <h3 className="text-[15px] font-semibold text-[var(--po-ink)]">Authenticator App</h3>
          {!isLoading && (
            <span
              className={`ml-auto text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                factors.length > 0
                  ? "bg-[var(--po-accent)]/15 text-[var(--po-accent)]"
                  : "bg-[var(--po-chip)] text-[var(--po-ink-2)]"
              }`}
            >
              {factors.length > 0 ? "Enabled" : "Not Configured"}
            </span>
          )}
        </div>

        <div className="p-5 space-y-6">
          {isLoading ? (
            <div className="flex items-center text-[13px] text-[var(--po-ink-2)]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <>
              {factors.length > 0 && (
                <div className="space-y-4">
                  <div className="text-[13px] font-medium text-[var(--po-ink-2)]">
                    Verified Authenticators
                  </div>
                  {factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between bg-[var(--po-chip)]/40 border border-[var(--po-line)] p-3 rounded-[12px]"
                    >
                      <div className="text-[14px] font-medium text-[var(--po-ink)]">
                        {factor.friendly_name || "Production OS Owner"}
                      </div>
                      <button
                        onClick={() => handleRemoveClick(factor.id)}
                        disabled={isRemoving === factor.id}
                        className="text-[#E5534B] hover:text-[#E5534B]/80 p-1.5 rounded-full hover:bg-[#E5534B]/10 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Remove Authenticator"
                      >
                        {isRemoving === factor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}

                  {removeError && (
                    <div className="text-[13px] text-[#E5534B] p-3 bg-[#E5534B]/10 border border-[#E5534B]/20 rounded-[12px]">
                      {removeError}
                    </div>
                  )}

                  {!enrollData && (
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--po-accent)] hover:underline transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Backup Authenticator
                    </button>
                  )}
                </div>
              )}

              {factors.length === 0 && !enrollData && (
                <div className="space-y-4">
                  <p className="text-[13px] text-[var(--po-ink-2)] leading-relaxed">
                    Two-step verification is required for Owner access. Use an authenticator app like Google Authenticator or Authy.
                  </p>
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="inline-flex items-center justify-center rounded-full bg-[var(--po-ink)] text-[var(--po-card)] px-5 py-2 text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Up Authenticator"}
                  </button>
                </div>
              )}

              {enrollData && (
                <div className="border border-[var(--po-line)] rounded-[16px] p-5 bg-[var(--po-chip)]/30 space-y-6">
                  <div className="space-y-2 text-center">
                    <h4 className="text-[14px] font-semibold text-[var(--po-ink)]">Scan this QR Code</h4>
                    <p className="text-[12px] text-[var(--po-ink-2)]">Open your authenticator app and scan the QR code.</p>
                    <div className="mx-auto w-48 h-48 bg-white p-3 rounded-[12px] shadow-[var(--po-shadow-sm)] flex items-center justify-center">
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: enrollData.qrCode }} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--po-line)]">
                      <h4 className="text-[13px] font-medium text-[var(--po-ink)] mb-1.5">Or enter this setup secret manually:</h4>
                      <code className="text-[12px] font-mono bg-[var(--po-chip)] border border-[var(--po-line)] px-2.5 py-1 rounded-[8px] text-[var(--po-accent)] select-all tracking-wider">
                        {enrollData.secret}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-[var(--po-line)] pt-4">
                    <h4 className="text-[14px] font-semibold text-[var(--po-ink)]">Verify Code</h4>
                    <p className="text-[12px] text-[var(--po-ink-2)]">Enter the 6-digit code generated by your app.</p>

                    {enrollError && (
                      <div className="text-[13px] text-[#E5534B] p-3 bg-[#E5534B]/10 border border-[#E5534B]/20 rounded-[12px]">
                        {enrollError}
                      </div>
                    )}

                    <div className="flex gap-2 max-w-xs">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ""))}
                        className="block w-full rounded-[12px] border border-[var(--po-line)] bg-[var(--po-chip)] px-3 py-2 text-[var(--po-ink)] placeholder-[var(--po-ink-2)]/60 focus:border-[var(--po-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--po-accent)] text-center tracking-widest text-lg font-mono"
                        placeholder="000000"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEnrollData(null)}
                        className="inline-flex items-center justify-center rounded-full border border-[var(--po-line-2)] bg-transparent px-4 py-2 text-[13px] font-medium text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleVerify}
                        disabled={isVerifying || verifyCode.length !== 6}
                        className="inline-flex items-center justify-center rounded-full bg-[var(--po-accent)] px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable Authenticator"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={factorToRemove !== null}
        title="Remove Authenticator"
        description={
          factors.length === 1
            ? "WARNING: Removing your final Authenticator may prevent Owner access. Supabase does not provide recovery codes. We recommend adding a backup TOTP factor first.\n\nAre you sure you want to proceed?"
            : "Remove this authenticator?"
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isRemoving === factorToRemove}
        onConfirm={() => {
          if (factorToRemove) {
            const id = factorToRemove;
            setFactorToRemove(null);
            void executeRemove(id);
          }
        }}
        onCancel={() => setFactorToRemove(null)}
      />
    </div>
  );
}
