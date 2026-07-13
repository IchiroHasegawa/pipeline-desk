"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

type SyncDriveFoldersModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SyncDriveFoldersModal({ isOpen, onClose }: SyncDriveFoldersModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkPending = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/google-drive/folders/sync-missing/pending");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to check pending assets");
      
      setPendingIds(data.pendingAssetIds || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      checkPending();
    } else {
      setTimeout(() => {
        setPendingIds([]);
        setCompletedCount(0);
        setFailedCount(0);
        setError(null);
      }, 0);
    }
  }, [isOpen]);

  const startSync = async () => {
    if (pendingIds.length === 0) return;
    setIsProcessing(true);
    setCompletedCount(0);
    setFailedCount(0);
    setError(null);

    const queue = [...pendingIds];
    let successes = 0;
    let failures = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const assetId = queue.shift();
        if (!assetId) continue;
        
        try {
          const res = await fetch("/api/google-drive/folders/provision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId }),
          });
          const data = await res.json();
          if (data.success) {
            successes++;
            setCompletedCount(successes);
          } else {
            failures++;
            setFailedCount(failures);
          }
        } catch {
          failures++;
          setFailedCount(failures);
        }
      }
    };

    // Concurrency of 2
    const workers = [worker(), worker()];
    await Promise.all(workers);
    
    setIsProcessing(false);
    
    // Refresh pending ids
    await checkPending();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md flex flex-col rounded-lg border border-[#2a2a2a] bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] p-4">
          <h2 className="text-lg font-bold text-white">Sync Missing Drive Folders</h2>
          <button onClick={() => !isProcessing && onClose()} disabled={isProcessing} className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {isChecking ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-4" />
              <p>Checking Assets...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingIds.length === 0 && completedCount === 0 && failedCount === 0 ? (
                <div className="text-center py-6 text-zinc-400">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p>All assets have Google Drive folders.</p>
                </div>
              ) : (
                <>
                  <div className="bg-zinc-900 rounded border border-[#2a2a2a] p-4 text-center">
                    <p className="text-3xl font-bold text-white mb-1">
                      {isProcessing ? `${completedCount + failedCount} / ${pendingIds.length + completedCount + failedCount}` : pendingIds.length}
                    </p>
                    <p className="text-xs font-bold uppercase text-zinc-500">
                      {isProcessing ? "Asset folders prepared" : "Assets missing folders"}
                    </p>
                  </div>
                  
                  {(completedCount > 0 || failedCount > 0) && (
                    <div className="space-y-2 mt-4 text-sm">
                      <p className="text-zinc-300 font-bold">Completed:</p>
                      <p className="text-green-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {completedCount} folders prepared</p>
                      {failedCount > 0 && <p className="text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {failedCount} folder(s) could not be prepared</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#2a2a2a] p-4">
          <button
            type="button"
            onClick={() => !isProcessing && onClose()}
            className="rounded px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-50"
            disabled={isProcessing}
          >
            {completedCount > 0 && pendingIds.length === 0 ? "Close" : "Cancel"}
          </button>
          
          {pendingIds.length > 0 && (
            <button
              onClick={startSync}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
              disabled={isProcessing || isChecking}
            >
              {isProcessing && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isProcessing ? "Processing..." : failedCount > 0 ? "Retry Failed" : "Start Sync"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
