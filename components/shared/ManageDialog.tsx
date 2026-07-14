"use client";

import { useState } from "react";
import { X, Search, Edit2, Archive, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ManageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  onRefresh: () => void;
  entityType: "Asset" | "Project" | "Environment" | "Job" | "Scene";
  onEdit?: (item: T) => void;
  isHidden?: boolean;
};

export default function ManageDialog<T extends { id: string; status?: string; created_at?: string }>({ 
  isOpen, 
  onClose, 
  title, 
  items, 
  onRefresh, 
  entityType, 
  onEdit,
  isHidden 
}: ManageDialogProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [impactMessages, setImpactMessages] = useState<string[]>([]);
  const [isFetchingImpact, setIsFetchingImpact] = useState(false);
  const supabase = createClient();

  const getTableName = () => {
    switch (entityType) {
      case "Asset": return "assets";
      case "Project": return "projects";
      case "Environment": return "production_environments";
      case "Job": return "episodes";
      case "Scene": return "scenes";
      default: return "";
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getName = (item: any) => {
    if (entityType === "Asset") return item.assetName;
    if (entityType === "Project") return item.title;
    if (entityType === "Environment") return item.environmentName;
    if (entityType === "Job") return item.title || item.jobName;
    if (entityType === "Scene") return item.sceneName || item.sceneNumber;
    return item.name || item.title || "Unknown";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCode = (item: any) => {
    if (entityType === "Asset") return item.assetCode;
    if (entityType === "Project") return item.projectCode || item.code;
    if (entityType === "Environment") return item.environmentCode || item.code;
    if (entityType === "Scene") return item.sceneCode;
    return item.code || "";
  };

  const handleRetire = async (id: string, currentStatus: string) => {
    setIsProcessing(true);
    try {
      const newStatus = currentStatus === "Retired" ? "Active" : "Retired";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from(getTableName() as any).update({ status: newStatus }).eq("id", id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitiateDelete = async (id: string) => {
    if (entityType === "Asset") {
      setConfirmDeleteId(id);
      return;
    }
    
    setIsFetchingImpact(true);
    setImpactMessages([]);
    try {
      const res = await fetch(`/api/production/impact?entityType=${entityType}&id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setImpactMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
    setIsFetchingImpact(false);
    setConfirmDeleteId(id);
  };

  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      if (entityType === "Asset") {
        const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || "Failed to delete asset");
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from(getTableName() as any).delete().eq("id", id);
      }
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items.filter(item => {
    const term = searchQuery.toLowerCase();
    const name = getName(item)?.toLowerCase() || "";
    const code = getCode(item)?.toLowerCase() || "";
    return name.includes(term) || code.includes(term);
  });

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${isHidden ? 'hidden' : ''}`}>
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg border border-[#2a2a2a] bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] p-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={() => onClose()} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Quick Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="sticky top-0 bg-[#121212] text-xs uppercase text-zinc-500 border-b border-[#2a2a2a]">
              <tr>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Created Date</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredItems.map(item => {
                const isConfirming = confirmDeleteId === item.id;
                const isRetired = item.status === "Retired";
                return (
                  <tr key={item.id} className="hover:bg-[#1a1a1a]">
                    <td className="py-3 font-medium text-white">{getName(item)}</td>
                    <td className="py-3">{getCode(item)}</td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isRetired ? "bg-zinc-800 text-zinc-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {item.status || "Active"}
                      </span>
                    </td>
                    <td className="py-3">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</td>
                    <td className="py-3 text-right">
                      {isConfirming ? (
                        <div className="flex items-center justify-end">
                           <span className="text-xs text-red-400 font-semibold mr-2 animate-pulse">Awaiting Confirm...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <button className="text-zinc-500 hover:text-white" title="Edit" disabled={isProcessing} onClick={() => onEdit?.(item)}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            className={`${isRetired ? "text-green-500 hover:text-green-400" : "text-yellow-500 hover:text-yellow-400"}`}
                            title={isRetired ? "Restore" : "Retire"}
                            onClick={() => handleRetire(item.id, item.status)}
                            disabled={isProcessing}
                          >
                            {isRetired ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          </button>
                          <button className="text-red-500 hover:text-red-400" title="Delete" onClick={() => handleInitiateDelete(item.id)} disabled={isProcessing || isFetchingImpact}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Confirm Delete Modal Overlay */}
      {confirmDeleteId && (() => {
        const itemToConfirm = items.find(i => i.id === confirmDeleteId);
        if (!itemToConfirm) return null;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#121212] border border-[#2a2a2a] rounded-lg shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-zinc-300">
                Are you sure you want to completely delete <strong>{getName(itemToConfirm)}</strong>?
              </p>
              
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-2 mt-2">
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Impact Summary</p>
                {entityType === "Asset" ? (
                  <p className="text-sm text-red-400">The respective Google Drive folder and files will also be permanently deleted.</p>
                ) : impactMessages.length > 0 ? (
                  <div className="text-sm text-red-400">
                    This will also permanently delete:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {impactMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">All nested items (if any) will also be deleted.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)} 
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-700 rounded" 
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)} 
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors flex items-center justify-center min-w-[140px]" 
                  disabled={isProcessing}
                >
                  {isProcessing ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
