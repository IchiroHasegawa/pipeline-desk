"use client";

import { useState, useRef, useEffect } from "react";
import type { Asset } from "@/types/production";
import { uploadAssetFile, type UploadProgress } from "@/lib/google-drive-client";
import { X, UploadCloud, FileIcon, XCircle, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

type AssetUploadDialogProps = {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type FileEntry = {
  id: string;
  file: File;
  destination: "Source" | "Preview";
  progress: UploadProgress;
  abortController?: AbortController;
  driveFileId?: string;
};

const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".ps1", ".vbs", ".js"];
const PREVIEW_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

export default function AssetUploadDialog({ asset, isOpen, onClose, onSuccess }: AssetUploadDialogProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [destination, setDestination] = useState<"Source" | "Preview">("Source");
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveStatusError, setDriveStatusError] = useState("");
  const [isSettingPreview, setIsSettingPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Check Drive status
      fetch("/api/google-drive/status")
        .then(res => res.json())
        .then(data => {
          if (data.status === "Connected") {
            setIsDriveConnected(true);
          } else {
            setIsDriveConnected(false);
            setDriveStatusError("Google Drive is not connected.");
          }
        })
        .catch(() => {
          setIsDriveConnected(false);
          setDriveStatusError("Google Drive is not connected.");
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesAdded = (newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles).map((file) => {
      let error = undefined;
      let status: UploadProgress["status"] = "Queued";
      
      const extension = file.name.includes('.') ? "." + file.name.split('.').pop()?.toLowerCase() : "";
      
      if (BLOCKED_EXTENSIONS.includes(extension)) {
        error = "This file type is not allowed.";
        status = "Failed";
      } else if (destination === "Preview" && !PREVIEW_EXTENSIONS.includes(extension)) {
        error = "Preview destination only accepts image files (.png, .jpg, .jpeg, .webp).";
        status = "Failed";
      }

      return {
        id: Math.random().toString(36).substring(7),
        file,
        destination,
        progress: {
          bytesUploaded: 0,
          totalBytes: file.size,
          percentage: 0,
          status,
          error,
        }
      };
    });

    setFiles(prev => [...prev, ...entries]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const cancelUpload = (id: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        if (f.abortController) {
          f.abortController.abort();
        }
        return { ...f, progress: { ...f.progress, status: "Cancelled", error: "Cancelled by user" } };
      }
      return f;
    }));
  };

  const startUpload = async (fileEntry: FileEntry) => {
    if (fileEntry.progress.status === "Failed" || fileEntry.progress.status === "Complete") return;

    const abortController = new AbortController();
    
    setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, abortController } : f));

    try {
      const result = await uploadAssetFile({
        assetId: asset.id,
        file: fileEntry.file,
        destination: fileEntry.destination,
        signal: abortController.signal,
        onProgress: (progress) => {
          setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, progress } : f));
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      if (result?.file?.drive_file_id) {
        setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, driveFileId: result.file!.drive_file_id } : f));
      }
    } catch {
      // Error is handled in progress state
    }
  };

  const handleSetPreview = async (driveFileId: string) => {
    setIsSettingPreview(driveFileId);
    try {
      await fetch(`/api/assets/${asset.id}/set-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveFileId })
      });
      if (onSuccess) onSuccess();
    } finally {
      setIsSettingPreview(null);
    }
  };

  const uploadAll = async () => {
    const toUpload = files.filter(f => f.progress.status === "Queued" || f.progress.status === "Failed" || f.progress.status === "Cancelled");
    
    // Process queue up to 2 concurrently
    const queue = [...toUpload];
    const active = new Set<Promise<void>>();

    while (queue.length > 0 || active.size > 0) {
      while (queue.length > 0 && active.size < 2) {
        const entry = queue.shift()!;
        const p = startUpload(entry).finally(() => {
          active.delete(p);
        });
        active.add(p);
      }
      
      if (active.size > 0) {
        await Promise.race(active);
      }
    }
    
    // Check if everything is done successfully
    const allDone = files.every(f => f.progress.status === "Complete" || f.progress.status === "Failed" || f.progress.status === "Cancelled");
    if (allDone && onSuccess && files.some(f => f.progress.status === "Complete")) {
       onSuccess();
    }
  };

  const isUploading = files.some(f => ["Preparing", "Uploading", "Finalizing"].includes(f.progress.status));
  const completedCount = files.filter(f => f.progress.status === "Complete").length;
  const totalCount = files.length;
  
  const canUploadAll = files.length > 0 && 
    isDriveConnected && 
    asset && 
    files.some(f => f.progress.status === "Queued" || f.progress.status === "Failed" || f.progress.status === "Cancelled") &&
    !isUploading;

  const canClose = !isUploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Upload Files</h2>
          <button 
            onClick={() => canClose && onClose()} 
            disabled={!canClose}
            className={`rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white ${!canClose ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Asset Info Header */}
          <div className="flex gap-4 text-sm bg-zinc-900 p-3 rounded border border-zinc-800">
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Asset:</span>
              <p className="text-zinc-200">{asset.assetName}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Asset Code:</span>
              <p className="text-zinc-200">{asset.assetCode}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Category:</span>
              <p className="text-zinc-200">{asset.category?.name || "Uncategorized"}</p>
            </div>
          </div>

          {!isDriveConnected && (
            <div className="bg-red-950/30 border border-red-900/50 rounded p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {driveStatusError || "Google Drive is not connected."}
            </div>
          )}

          {/* Upload Controls */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Destination</label>
              <select 
                value={destination}
                onChange={(e) => setDestination(e.target.value as "Source" | "Preview")}
                disabled={isUploading}
                className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
              >
                <option value="Source">Source</option>
                <option value="Preview">Preview</option>
              </select>
            </div>
          </div>

          {/* Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg p-8 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-10 w-10 text-zinc-500 mb-2" />
            <p className="text-zinc-300 font-medium">Drag files here</p>
            <p className="text-zinc-500 text-sm mt-1">or click to Browse Files</p>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-500 uppercase">
                <span>Selected Files</span>
                <span>{completedCount} of {totalCount} files uploaded</span>
              </div>
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f.id} className="flex flex-col bg-zinc-900 border border-zinc-800 rounded p-3 gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="h-5 w-5 text-zinc-500 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-zinc-200 truncate">{f.file.name}</span>
                          <span className="text-xs text-zinc-500">
                            {f.file.name.includes('.') ? "." + f.file.name.split('.').pop()?.toLowerCase() : "unknown"} • 
                            {f.file.type || "application/octet-stream"} • 
                            {(f.file.size / 1024 / 1024).toFixed(2)} MB • 
                            {f.destination}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {f.progress.status === "Uploading" || f.progress.status === "Preparing" || f.progress.status === "Finalizing" ? (
                          <button onClick={() => cancelUpload(f.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Cancel
                          </button>
                        ) : f.progress.status === "Failed" || f.progress.status === "Cancelled" ? (
                          <>
                            <button onClick={() => startUpload(f)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" /> Retry
                            </button>
                            <button onClick={() => removeFile(f.id)} className="text-xs text-zinc-500 hover:text-zinc-300">
                              Remove
                            </button>
                          </>
                        ) : f.progress.status === "Complete" ? (
                          <div className="flex items-center gap-2">
                            {f.destination === "Preview" && f.driveFileId && PREVIEW_EXTENSIONS.includes(f.file.name.includes('.') ? "." + f.file.name.split('.').pop()?.toLowerCase() : "") && (
                              <button 
                                onClick={() => handleSetPreview(f.driveFileId!)} 
                                disabled={isSettingPreview !== null}
                                className="text-[10px] font-bold uppercase bg-zinc-800 text-blue-400 px-2 py-1 rounded hover:bg-zinc-700 hover:text-blue-300 disabled:opacity-50"
                              >
                                {isSettingPreview === f.driveFileId ? "Setting..." : "Set as Preview"}
                              </button>
                            )}
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Complete
                            </span>
                          </div>
                        ) : (
                          <button onClick={() => removeFile(f.id)} className="text-xs text-zinc-500 hover:text-zinc-300">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          f.progress.status === "Failed" ? "bg-red-500" :
                          f.progress.status === "Complete" ? "bg-green-500" :
                          "bg-blue-500"
                        }`} 
                        style={{ width: `${f.progress.percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>{f.progress.status}</span>
                      {f.progress.error ? (
                        <span className="text-red-400">{f.progress.error}</span>
                      ) : (
                        <span>{f.progress.percentage}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 p-4 bg-zinc-900 rounded-b-lg">
          <button
            onClick={() => canClose && onClose()}
            disabled={!canClose}
            className={`px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white ${!canClose ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Cancel
          </button>
          <button
            onClick={uploadAll}
            disabled={!canUploadAll}
            className={`rounded bg-white px-4 py-2 text-sm font-bold text-black transition-colors ${
              canUploadAll ? "hover:bg-zinc-200" : "opacity-50 cursor-not-allowed"
            }`}
          >
            Upload All
          </button>
        </div>
      </div>
    </div>
  );
}
