"use client";

import { useEffect, useState } from "react";
import { HardDrive, RefreshCw, Unplug, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { LoadingMessage } from "@/components/ui/LoadingState";

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

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? Files will not be deleted.")) return;
    
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
      <div className="rounded border border-[#2a2a2a] bg-zinc-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="h-6 w-6 text-zinc-400" />
          <h2 className="text-xl font-bold text-white">Storage Integrations</h2>
        </div>
        <p className="text-zinc-400 mb-4">
          Google Drive connection is currently unavailable in production.
        </p>
        {/* Production OS authentication and administrator authorization are required before enabling Drive connection in production. */}
      </div>
    );
  }

  if (isLoading) {
    return <LoadingMessage message="Loading connection status..." />;
  }

  const isConnected = connection?.status === "Connected";
  const hasError = connection?.status === "Error";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="h-6 w-6 text-zinc-400" />
        <h2 className="text-xl font-bold text-white">Storage Integrations</h2>
      </div>

      <div className="rounded border border-[#2a2a2a] bg-zinc-900 overflow-hidden">
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Google Drive
                {isConnected && <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-900/50 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected</span>}
                {hasError && <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-900/50 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Error</span>}
                {(!isConnected && !hasError) && <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full border border-zinc-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Disconnected</span>}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">Connect a Google Drive account to store Production OS assets.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {(isConnected || hasError) ? (
                <>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTesting ? "animate-spin" : ""}`} />
                    Test Connection
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] hover:bg-zinc-800 text-zinc-300 rounded text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    Reconnect
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 border border-red-900/50 text-red-500 hover:bg-red-900/20 rounded text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <Unplug className="w-4 h-4" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition-colors"
                >
                  Connect Google Drive
                </button>
              )}
            </div>
          </div>
        </div>

        {(isConnected || hasError) && (
          <div className="p-6 bg-black/20 grid grid-cols-2 gap-6">
            <div>
              <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Label</span>
              <span className="text-sm text-zinc-300">{connection?.account_label || "Not available"}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Last Connected Time</span>
              <span className="text-sm text-zinc-300">
                {connection?.last_connected_at ? new Date(connection.last_connected_at).toLocaleString() : "Never"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Production OS Root Folder ID</span>
              <span className="text-sm text-zinc-300 font-mono bg-black/40 px-2 py-1 rounded border border-[#2a2a2a]">
                {connection?.root_folder_id || "None"}
              </span>
            </div>
          </div>
        )}
      </div>

      {testResult && (
        <div className={`p-4 rounded border ${testResult.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-400' : 'bg-red-900/20 border-red-900/50 text-red-400'}`}>
          <p className="text-sm font-bold flex items-center gap-2">
            {testResult.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {testResult.message}
          </p>
        </div>
      )}
    </div>
  );
}
