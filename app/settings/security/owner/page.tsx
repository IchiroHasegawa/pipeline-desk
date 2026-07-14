"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Factor } from "@supabase/supabase-js";
import { Loader2, ShieldAlert, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      setFactors(data.factors.filter(f => f.status === 'verified' && f.factor_type === 'totp'));
    }
    setIsLoading(false);
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setEnrollError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Production OS',
        friendlyName: 'Production OS Owner',
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
        factorId: enrollData.id
      });
      
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challengeData.id,
        code: verifyCode
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

  const handleRemove = async (factorId: string) => {
    if (factors.length === 1) {
      if (!window.confirm("WARNING: Removing your final Authenticator may prevent Owner access. Supabase does not provide recovery codes. We recommend adding a backup TOTP factor first.\n\nAre you sure you want to proceed?")) {
        return;
      }
    } else {
      if (!window.confirm("Remove this authenticator?")) return;
    }

    setIsRemoving(factorId);
    setRemoveError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      });
      
      if (error) {
        // If recent AAL2 is needed, this might fail with an AAL related error.
        throw error;
      }
      
      await loadFactors();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Failed to remove authenticator. You may need to log in again to verify a recent AAL2 session.");
    }
    setIsRemoving(null);
  };

  return (
    <div className="space-y-6 max-w-3xl p-4">
      <div>
        <h2 className="text-xl font-bold text-white">Owner Authentication</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage two-step verification</p>
      </div>

      <div className="rounded-lg border border-[#2a2a2a] bg-zinc-900 overflow-hidden">
        <div className="border-b border-[#2a2a2a] p-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-white" />
          <h3 className="font-semibold text-white">Authenticator App</h3>
          {!isLoading && (
            <span className={`ml-auto text-xs px-2 py-1 rounded-full font-bold ${factors.length > 0 ? 'bg-green-500/20 text-green-500' : 'bg-zinc-700 text-zinc-300'}`}>
              {factors.length > 0 ? "Enabled" : "Not Configured"}
            </span>
          )}
        </div>
        
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <>
              {factors.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm text-zinc-300 font-medium">Verified Authenticators</div>
                  {factors.map(factor => (
                    <div key={factor.id} className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 p-3 rounded">
                      <div className="text-sm font-bold text-white">{factor.friendly_name || "Production OS Owner"}</div>
                      <button 
                        onClick={() => handleRemove(factor.id)}
                        disabled={isRemoving === factor.id}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Remove Authenticator"
                      >
                        {isRemoving === factor.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                  
                  {removeError && (
                    <div className="text-sm text-red-400 p-2 bg-red-500/10 border border-red-500/20 rounded">
                      {removeError}
                    </div>
                  )}

                  {!enrollData && (
                    <button 
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Backup Authenticator
                    </button>
                  )}
                </div>
              )}

              {factors.length === 0 && !enrollData && (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400">
                    Two-step verification is required for Owner access. Use an authenticator app like Google Authenticator or Authy.
                  </p>
                  <button 
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="flex items-center justify-center w-48 rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Up Authenticator"}
                  </button>
                </div>
              )}

              {enrollData && (
                <div className="border border-[#2a2a2a] rounded-lg p-4 bg-zinc-950 space-y-6">
                  <div className="space-y-2 text-center">
                    <h4 className="text-sm font-bold text-white">Scan this QR Code</h4>
                    <p className="text-xs text-zinc-400">Open your authenticator app and scan the QR code.</p>
                    <div className="mx-auto w-48 h-48 bg-white p-2 rounded">
                      {/* Using dangerouslySetInnerHTML for the SVG string from Supabase */}
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: enrollData.qrCode }} />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <h4 className="text-sm font-bold text-white mb-1">Or enter this setup secret manually:</h4>
                      <code className="text-xs font-mono bg-black px-2 py-1 rounded text-blue-400 select-all tracking-wider">{enrollData.secret}</code>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-[#2a2a2a] pt-4">
                    <h4 className="text-sm font-bold text-white">Verify Code</h4>
                    <p className="text-xs text-zinc-400">Enter the 6-digit code generated by your app.</p>
                    
                    {enrollError && (
                      <div className="text-xs text-red-400 p-2 bg-red-500/10 border border-red-500/20 rounded">
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
                        onChange={e => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="block w-full rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-widest text-lg font-mono"
                        placeholder="000000"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEnrollData(null)}
                        className="rounded border border-[#2a2a2a] bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleVerify}
                        disabled={isVerifying || verifyCode.length !== 6}
                        className="flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
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
    </div>
  );
}
