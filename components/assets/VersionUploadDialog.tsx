"use client";

import { useState, useRef, useEffect } from "react";
import type { Asset, AssetFile } from "@/types/production";
import { uploadAssetFile, type UploadProgress } from "@/lib/google-drive-client";
import { X, UploadCloud, FileIcon, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type VersionUploadDialogProps = {
  asset: Asset;
  sourceFile: AssetFile;
  isOpen: boolean;
  onClose: () => void;
};

export default function VersionUploadDialog({ asset, sourceFile, isOpen, onClose }: VersionUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveStatusError, setDriveStatusError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const currentVersion = sourceFile.versionNumber || 1;

  useEffect(() => {
    if (isOpen) {
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

  const handleClose = () => {
    setFile(null);
    setProgress(null);
    setError(null);
    setAbortController(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleFileAdded = (newFile: File) => {
    setError(null);
    const originalExt = sourceFile.extension?.toLowerCase() || "";
    const newExt = newFile.name.includes('.') ? "." + newFile.name.split('.').pop()?.toLowerCase() : "";

    if (originalExt && newExt !== originalExt) {
      setError(`The new version must use the ${originalExt} file type.`);
      return;
    }

    setFile(newFile);
    setProgress({
      bytesUploaded: 0,
      totalBytes: newFile.size,
      percentage: 0,
      status: "Queued",
    });
  };

  const startUpload = async () => {
    if (!file) return;

    const controller = new AbortController();
    setAbortController(controller);
    setError(null);

    try {
      await uploadAssetFile({
        assetId: asset.id,
        file: file,
        destination: "Versions",
        sourceFileId: sourceFile.id,
        signal: controller.signal,
        onProgress: setProgress
      });
      router.refresh();
      // Keep it open to show success, or close it? The prompt says "Show: Version 2 uploaded successfully."
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unable to upload the new version.");
    }
  };

  const cancelUpload = () => {
    if (abortController) {
      abortController.abort();
    }
    setProgress(prev => prev ? { ...prev, status: "Cancelled", error: "Cancelled by user" } : null);
  };

  const isUploading = progress?.status === "Uploading" || progress?.status === "Preparing" || progress?.status === "Finalizing";
  const isComplete = progress?.status === "Complete";
  const canClose = !isUploading;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Upload New Version</h2>
          <button 
            onClick={() => canClose && handleClose()} 
            disabled={!canClose}
            className={`rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white ${!canClose ? "opacity-50" : ""}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col p-4 space-y-4">
          <div className="flex gap-4 text-sm bg-zinc-900 p-3 rounded border border-zinc-800">
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Asset:</span>
              <p className="text-zinc-200">{asset.assetName}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Source File:</span>
              <p className="text-zinc-200">{sourceFile.originalFileName || sourceFile.fileName}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Current Version:</span>
              <p className="text-zinc-200">{currentVersion}</p>
            </div>
          </div>

          {!isDriveConnected && (
            <div className="bg-red-950/30 border border-red-900/50 rounded p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {driveStatusError || "Google Drive is not connected."}
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {isComplete && (
            <div className="bg-green-950/30 border border-green-900/50 rounded p-3 text-green-400 text-sm flex items-center gap-2">
              Version uploaded successfully.
            </div>
          )}

          {!file && !isComplete && (
            <div 
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileAdded(e.dataTransfer.files[0]);
              }}
              className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg p-8 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-zinc-500 mb-2" />
              <p className="text-zinc-300 font-medium">Select File</p>
              <p className="text-zinc-500 text-sm mt-1">
                Must be {sourceFile.extension || "same type"}
              </p>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                accept={sourceFile.extension || "*"}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileAdded(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {file && (
            <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded p-3 gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-5 w-5 text-zinc-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-zinc-200 truncate">{file.name}</span>
                    <span className="text-xs text-zinc-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • New Version
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {isUploading ? (
                    <button onClick={cancelUpload} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Cancel
                    </button>
                  ) : progress?.status === "Failed" || progress?.status === "Cancelled" ? (
                    <>
                      <button onClick={startUpload} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                      <button onClick={() => setFile(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                        Remove
                      </button>
                    </>
                  ) : !isComplete ? (
                    <button onClick={() => setFile(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              
              {progress && (
                <>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden mt-1">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        progress.status === "Failed" ? "bg-red-500" :
                        progress.status === "Complete" ? "bg-green-500" :
                        "bg-blue-500"
                      }`} 
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>{progress.status}</span>
                    {!progress.error && <span>{progress.percentage}%</span>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 p-4 bg-zinc-900 rounded-b-lg">
          <button
            onClick={() => canClose && handleClose()}
            disabled={!canClose}
            className={`px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white ${!canClose ? "opacity-50" : ""}`}
          >
            {isComplete ? "Close" : "Cancel"}
          </button>
          {!isComplete && (
            <button
              onClick={startUpload}
              disabled={!file || !isDriveConnected || isUploading}
              className={`rounded bg-white px-4 py-2 text-sm font-bold text-black transition-colors ${
                !file || !isDriveConnected || isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-200"
              }`}
            >
              Upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
