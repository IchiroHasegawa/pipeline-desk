// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useEffect, useState } from "react";
import { HardDrive, RefreshCw, Unplug, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { LoadingMessage } from "@/components/ui/LoadingState";
import { ConfirmDialog } from "@/components/app-shell";

type ConnectionStatus = {
  status: "Connected" | "Disconnected" | "Error";
  last_connected_at: string | null;
  account_label: string | null;
  root_folder_id: string | null;
};

export default function StorageSettings() {
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);

  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    async function fetchStatus() {
      if (!isDevelopment) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/google-drive/status");
        if (res.ok) {
          const data = await res.json();
          setConnection(data as ConnectionStatus);
        }
      } catch (err) {
        console.error("Failed to load status", err);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchStatus();
  }, [isDevelopment]);

  const handleConnect = () => {
    window.location.href = "/api/google-drive/connect";
  };

  const handleDisconnectClick = () => {
    setIsDisconnectDialogOpen(true);
  };

  const executeDisconnect = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/google-drive/disconnect", { method: "POST" });
      if (res.ok) {
        setConnection({
          status: "Disconnected",
          last_connected_at: null,
          account_label: null,
          root_folder_id: null
        });
        setTestResult({ type: "success", message: "Disconnected successfully." });
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch {
      setTestResult({ type: "error", message: "Failed to disconnect." });
    } finally {
      setIsTesting(false);
      setIsDisconnectDialogOpen(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/google-drive/test", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setTestResult({ type: "success", message: "Connection test passed!" });
        // Refresh status
        const statusRes = await fetch("/api/google-drive/status");
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setConnection(statusData as ConnectionStatus);
        }
      } else {
        setTestResult({ type: "error", message: data.error || "Connection test failed." });
        setConnection(prev => prev ? { ...prev, status: "Error" } : null);
      }
    } catch {
      setTestResult({ type: "error", message: "Failed to test connection." });
      setConnection(prev => prev ? { ...prev, status: "Error" } : null);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isDevelopment) {
    return (
      <div className="rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] p-6 shadow-[var(--po-shadow-sm)]">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="h-6 w-6 text-[var(--po-ink-2)]" />
          <h2 className="text-xl font-bold text-[var(--po-ink)]">Storage Integrations</h2>
        </div>
        <p className="text-[var(--po-ink-2)] mb-4">
          Google Drive connection is currently unavailable in production.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingMessage message="Loading connection status..." />;
  }

  const isConnected = connection?.status === "Connected";
  const hasError = connection?.status === "Error";

  return (
    <div className="space-y-6 max-w-[760px]">
      <div className="flex items-center gap-3">
        <HardDrive className="h-6 w-6 text-[var(--po-ink-2)]" />
        <h2 className="text-xl font-bold text-[var(--po-ink)]">Storage Integrations</h2>
      </div>

      <div className="rounded-[16px] border border-[var(--po-line)] bg-[var(--po-chip)] p-4">
        <p className="text-sm text-[var(--po-ink-2)]">
          Google Drive connection administration must be restricted to Owner or Administrator roles in the future Roles phase.
        </p>
      </div>

      <div className="rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-sm)] overflow-hidden">
        <div className="p-6 border-b border-[var(--po-line)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold text-[var(--po-ink)] flex items-center gap-2">
                Google Drive
                {isConnected && (
                  <span className="bg-[#28A745]/15 text-[#28A745] text-xs px-2.5 py-0.5 rounded-full border border-[#28A745]/30 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </span>
                )}
                {hasError && (
                  <span className="bg-[#E5534B]/15 text-[#E5534B] text-xs px-2.5 py-0.5 rounded-full border border-[#E5534B]/30 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3" /> Error
                  </span>
                )}
                {(!isConnected && !hasError) && (
                  <span className="bg-[var(--po-chip)] text-[var(--po-ink-3)] text-xs px-2.5 py-0.5 rounded-full border border-[var(--po-line-2)] flex items-center gap-1 font-medium">
                    <XCircle className="w-3 h-3" /> Disconnected
                  </span>
                )}
              </h3>
              <p className="text-[var(--po-ink-2)] text-sm mt-1">Connect a Google Drive account to store Production OS assets.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {(isConnected || hasError) ? (
                <>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 border border-[var(--po-line-2)] bg-transparent hover:bg-[var(--po-chip)] text-[var(--po-ink)] rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTesting ? "animate-spin" : ""}`} />
                    Test Connection
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 border border-[var(--po-line-2)] hover:bg-[var(--po-chip)] text-[var(--po-ink)] rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Reconnect
                  </button>
                  <button
                    onClick={handleDisconnectClick}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 border border-[#E5534B]/40 text-[#E5534B] hover:bg-[#E5534B]/10 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Unplug className="w-4 h-4" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-2 px-5 py-2 bg-[var(--po-ink)] hover:opacity-90 text-[var(--po-panel)] rounded-full text-sm font-semibold transition-opacity"
                >
                  Connect Google Drive
                </button>
              )}
            </div>
          </div>
        </div>

        {(isConnected || hasError) && (
          <div className="p-6 bg-[var(--po-bg)]/50 grid grid-cols-2 gap-6">
            <div>
              <span className="block text-xs font-semibold text-[var(--po-ink-3)] uppercase tracking-wider mb-1">Account Label</span>
              <span className="text-sm text-[var(--po-ink)]">{connection?.account_label || "Not available"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-[var(--po-ink-3)] uppercase tracking-wider mb-1">Last Connected Time</span>
              <span className="text-sm text-[var(--po-ink)]">
                {connection?.last_connected_at ? new Date(connection.last_connected_at).toLocaleString() : "Never"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs font-semibold text-[var(--po-ink-3)] uppercase tracking-wider mb-1">Production OS Root Folder ID</span>
              <span className="text-sm text-[var(--po-ink)] font-mono bg-[var(--po-card)] px-3 py-1.5 rounded-[8px] border border-[var(--po-line)] inline-block">
                {connection?.root_folder_id || "None"}
              </span>
            </div>
          </div>
        )}
      </div>

      {testResult && (
        <div className={`p-4 rounded-[16px] border ${testResult.type === 'success' ? 'bg-[#28A745]/10 border-[#28A745]/30 text-[#28A745]' : 'bg-[#E5534B]/10 border-[#E5534B]/30 text-[#E5534B]'}`}>
          <p className="text-sm font-medium flex items-center gap-2">
            {testResult.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {testResult.message}
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDisconnectDialogOpen}
        title="Disconnect Google Drive"
        description="Are you sure you want to disconnect Google Drive? Files will not be deleted."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isTesting}
        onConfirm={executeDisconnect}
        onCancel={() => setIsDisconnectDialogOpen(false)}
      />
    </div>
  );
}
