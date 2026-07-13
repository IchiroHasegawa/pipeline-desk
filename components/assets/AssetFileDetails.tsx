"use client";

import { useState } from "react";
import type { Asset, AssetFile } from "@/types/production";
import { X, ExternalLink, Download, Edit2, Check, Trash2, RotateCcw, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type AssetFileDetailsProps = {
  asset: Asset;
  file: AssetFile;
  isOpen: boolean;
  onClose: () => void;
};

export default function AssetFileDetails({ asset, file, isOpen, onClose }: AssetFileDetailsProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(file.displayName || file.originalFileName || file.fileName);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = `/api/assets/${asset.id}/files/${file.id}/download`;
  };

  const handleOpenDrive = () => {
    window.open(`/api/assets/${asset.id}/files/${file.id}/open`, "_blank");
  };

  const handleRename = async () => {
    if (!newDisplayName.trim()) return;
    setIsActionLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/assets/${asset.id}/files/${file.id}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newDisplayName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rename");
      }
      setIsRenaming(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAction = async (endpoint: string) => {
    setIsActionLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/assets/${asset.id}/files/${file.id}/${endpoint}`, {
        method: "POST"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to perform action`);
      }
      router.refresh();
      if (endpoint === "trash") {
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to perform action");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetStatus = async (status: string) => {
    setIsActionLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/assets/${asset.id}/files/${file.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to update status`);
      }
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-100">File Details</h2>
          <button 
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
           <div className="p-3 bg-red-900/30 border-b border-red-900 flex items-center gap-2 text-red-400 text-sm">
             <AlertTriangle className="h-4 w-4 shrink-0" />
             <p className="flex-1">{errorMsg}</p>
           </div>
        )}

        <div className="flex flex-col p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-zinc-500">Display Name</span>
            {isRenaming ? (
               <div className="flex items-center gap-2 mt-1">
                 <input 
                   type="text" 
                   value={newDisplayName} 
                   onChange={(e) => setNewDisplayName(e.target.value)} 
                   className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 flex-1 outline-none" 
                   autoFocus
                 />
                 <button onClick={handleRename} disabled={isActionLoading} className="bg-green-600 hover:bg-green-500 text-white p-1 rounded disabled:opacity-50">
                    <Check className="h-3 w-3" />
                 </button>
                 <button onClick={() => setIsRenaming(false)} disabled={isActionLoading} className="bg-zinc-700 hover:bg-zinc-600 text-white p-1 rounded disabled:opacity-50">
                    <X className="h-3 w-3" />
                 </button>
               </div>
            ) : (
               <div className="flex items-center gap-2">
                 <div className="text-xs text-zinc-300 font-bold">{file.displayName || file.originalFileName || file.fileName}</div>
                 <button onClick={() => setIsRenaming(true)} className="text-zinc-500 hover:text-zinc-300">
                    <Edit2 className="h-3 w-3" />
                 </button>
               </div>
            )}
          </div>
          
          <DetailRow label="Original File Name" value={file.originalFileName || file.fileName} />
          
          {file.restoredFromFileId && (
            <div className="bg-blue-500/10 border border-blue-500/30 p-2 rounded flex items-center gap-2 text-blue-400 text-xs">
               <RotateCcw className="h-3 w-3" />
               Restored from a previous version
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="File Role" value={file.fileRole || "Unknown"} />
            <DetailRow label="Version" value={file.versionNumber ? String(file.versionNumber) : "-"} />
            <DetailRow label="Extension" value={file.extension || "-"} />
            <DetailRow label="File Size" value={`${(file.sizeBytes / 1024 / 1024).toFixed(2)} MB`} />
          </div>
          
          <DetailRow label="Record Status" value={file.recordStatus || "Unknown"} />
          <DetailRow label="Uploaded At" value={new Date(file.createdAt).toLocaleString()} />
          
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Technical Details</h3>
            <DetailRow label="Google Drive Created Time" value={file.driveCreatedTime ? new Date(file.driveCreatedTime).toLocaleString() : "-"} />
            <DetailRow label="Google Drive File ID" value={file.driveFileId || "-"} />
            <DetailRow label="System ID" value={file.id} />
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-3">
             <h3 className="text-sm font-semibold text-zinc-300">Lifecycle Actions</h3>
             <div className="flex flex-wrap gap-2">
                {file.fileRole === "Versions" && file.recordStatus === "Active" && (
                   <button 
                     onClick={() => handleAction("make-current")}
                     disabled={isActionLoading}
                     className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                   >
                     <ArrowUpCircle className="h-3.5 w-3.5" /> Make Current
                   </button>
                )}
                
                {file.recordStatus === "Active" && (
                   <button 
                     onClick={() => handleSetStatus("Retired")}
                     disabled={isActionLoading}
                     className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                   >
                     Retire File
                   </button>
                )}
                
                {file.recordStatus === "Retired" && (
                   <button 
                     onClick={() => handleSetStatus("Active")}
                     disabled={isActionLoading}
                     className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                   >
                     Unretire File
                   </button>
                )}
                
                {(file.recordStatus === "Trashed" || file.recordStatus === "Missing") && file.fileRole === "Versions" && file.sourceFileId && (
                   <button 
                     onClick={() => handleAction("restore")}
                     disabled={isActionLoading}
                     className="flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50 w-full justify-center mt-2"
                   >
                     <RotateCcw className="h-3.5 w-3.5" /> Restore This Version
                   </button>
                )}

                {file.recordStatus !== "Trashed" && file.recordStatus !== "Missing" && (
                   <button 
                     onClick={() => handleAction("trash")}
                     disabled={isActionLoading}
                     className="flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50 ml-auto"
                   >
                     <Trash2 className="h-3.5 w-3.5" /> Move to Trash
                   </button>
                )}
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 p-4 bg-zinc-900 shrink-0">
          <button
            onClick={handleDownload}
            disabled={!file.driveFileId || file.recordStatus !== "Active"}
            className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            <Download className="h-3 w-3" /> Download
          </button>
          <button
            onClick={handleOpenDrive}
            disabled={!file.driveFileId || (file.recordStatus !== "Active" && file.recordStatus !== "Retired")}
            className="flex items-center gap-2 rounded bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            <ExternalLink className="h-3 w-3" /> Open in Google Drive
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500">{label}</span>
      <div className="text-xs text-zinc-300 break-all">{value}</div>
    </div>
  );
}
