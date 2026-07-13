"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, FileIcon, XCircle, CheckCircle2 } from "lucide-react";
import type { Asset, AssetCategory } from "@/types/production";
import { createAsset, createAssetCategory } from "@/lib/data/productionRepository";
import { uploadAssetFile } from "@/lib/google-drive-client";
import type { UploadProgress } from "@/lib/google-drive-client";

type AssetFormProps = {
  onClose: () => void;
  onCreated: (asset: Asset) => void;
  categories: AssetCategory[];
};

type FileEntry = {
  id: string;
  file: File;
  isPreview: boolean;
  progress: UploadProgress;
  abortController?: AbortController;
};

const PREVIEW_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

export default function AssetForm({ onClose, onCreated, categories }: AssetFormProps) {
  const [activeTab, setActiveTab] = useState<"info" | "files" | "assembly">("info");
  const [assetName, setAssetName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(4);
  const [categoryId, setCategoryId] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [workflow, setWorkflow] = useState("Basic");
  const [tags, setTags] = useState("");
  
  const [files, setFiles] = useState<FileEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if asset was already created in DB to prevent duplicates on retry
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);

  const handleFilesAdded = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    setFiles(prev => {
      let hasPreviewAlready = prev.some(f => f.isPreview);
      const entries: FileEntry[] = fileArray.map((file) => {
        const ext = file.name.includes('.') ? "." + file.name.split('.').pop()?.toLowerCase() : "";
        const canBePreview = PREVIEW_EXTENSIONS.includes(ext);
        let isPreview = false;
        if (canBePreview && !hasPreviewAlready) {
          isPreview = true;
          hasPreviewAlready = true;
        }

        return {
          id: Math.random().toString(36).substring(7),
          file,
          isPreview,
          progress: {
            bytesUploaded: 0,
            totalBytes: file.size,
            percentage: 0,
            status: "Queued",
          }
        };
      });
      return [...prev, ...entries];
    });
  };

  const setAsPreview = (id: string) => {
    setFiles(prev => prev.map(f => ({
      ...f,
      isPreview: f.id === id
    })));
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      // Auto-assign new preview if the removed one was the preview
      if (prev.find(f => f.id === id)?.isPreview) {
        const nextPreview = filtered.find(f => {
          const ext = f.file.name.includes('.') ? "." + f.file.name.split('.').pop()?.toLowerCase() : "";
          return PREVIEW_EXTENSIONS.includes(ext);
        });
        if (nextPreview) {
          nextPreview.isPreview = true;
        }
      }
      return filtered;
    });
  };

  const cancelUpload = (id: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        if (f.abortController) f.abortController.abort();
        return { ...f, progress: { ...f.progress, status: "Cancelled", error: "Cancelled by user" } };
      }
      return f;
    }));
  };

  const startUpload = async (fileEntry: FileEntry, assetId: string): Promise<boolean> => {
    if (fileEntry.progress.status === "Failed" || fileEntry.progress.status === "Complete" || fileEntry.progress.status === "Cancelled") return false;

    const abortController = new AbortController();
    setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, abortController } : f));

    try {
      const result = await uploadAssetFile({
        assetId,
        file: fileEntry.file,
        destination: fileEntry.isPreview ? "Preview" : "Source",
        signal: abortController.signal,
        onProgress: (progress) => {
          setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, progress } : f));
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      
      if (fileEntry.isPreview && result.file?.drive_file_id) {
        await fetch(`/api/assets/${assetId}/set-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driveFileId: result.file.drive_file_id })
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetCode.trim()) {
      setError("Asset Name and Asset Code are required.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      let currentAsset = createdAsset;

      if (!currentAsset) {
        let finalCategoryId = categoryId;
        if (isCreatingCategory && newCategoryName.trim()) {
          const newCat = await createAssetCategory(newCategoryName);
          finalCategoryId = newCat.id;
        }

        currentAsset = await createAsset({
          assetName,
          assetCode,
          description,
          priority,
          categoryId: finalCategoryId || null,
          assetType,
          workflow,
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          status: "Active",
        });
        
        setCreatedAsset(currentAsset);
        // Call onCreated to add it to the table immediately without closing the dialog
        // (Wait, the prop is onCreated, which currently closes. We'll modify the parent to not close it immediately if we change the prop semantics, but we can't change it here yet. Let's assume parent won't close if we don't call it? No, if we call it, parent closes. So we only call onCreated at the VERY end if all success.)
        // But the prompt says "Display the new Asset immediately". We will update the parent to handle this via a new callback prop or by separating `onCreated` and `onClose`.
        // We will call `onCreated(currentAsset)` at the very end.
        // Wait! We can't update the table immediately unless we call a callback.
        // I will change the props to `onCreated` (adds to table) and we just don't call `onClose` here. The parent doesn't close it on `onCreated`.
        onCreated(currentAsset);
      }

      // Provision folders
      let provisionSuccess = false;
      try {
        const provRes = await fetch("/api/google-drive/folders/provision", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: currentAsset.id })
        });
        const provData = await provRes.json();
        provisionSuccess = provData.success;
      } catch (err) {
        console.error("Folder provision failed", err);
      }

      let uploadFailures = 0;
      let uploadSuccesses = 0;

      const toUpload = files.filter(f => f.progress.status === "Queued" || f.progress.status === "Failed" || f.progress.status === "Cancelled");
      
      if (toUpload.length > 0) {
        if (!provisionSuccess) {
          uploadFailures = toUpload.length;
          setError("Asset created. Google Drive folders are pending.");
        } else {
          // Process sequentially or limited concurrency
          for (const f of toUpload) {
            const success = await startUpload(f, currentAsset.id);
            if (success) uploadSuccesses++;
            else uploadFailures++;
          }
        }
      }

      setIsSubmitting(false);

      if (uploadFailures > 0) {
        setError(`Asset created. ${uploadSuccesses} files uploaded. ${uploadFailures} files failed.`);
        return; // Don't close
      }
      
      // If we reach here, everything is complete or there were no files
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save asset.");
      setIsSubmitting(false);
    }
  };

  const isUploading = files.some(f => ["Preparing", "Uploading", "Finalizing"].includes(f.progress.status));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg border border-[#2a2a2a] bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] p-6">
          <h2 className="text-xl font-bold text-white">Create Asset</h2>
          <button onClick={() => !isUploading && onClose()} disabled={isUploading} className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-[#2a2a2a] px-6">
          <TabButton label="Asset Information" active={activeTab === "info"} onClick={() => setActiveTab("info")} />
          <TabButton label="Asset Files" active={activeTab === "files"} onClick={() => setActiveTab("files")} />
          <TabButton label="Assembly" active={activeTab === "assembly"} onClick={() => setActiveTab("assembly")} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Asset Name *</label>
                  <input
                    type="text"
                    required
                    disabled={!!createdAsset}
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Asset Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!createdAsset}
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
                <textarea
                  value={description}
                  disabled={!!createdAsset}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 w-full resize-none rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Category</label>
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={!!createdAsset}
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                      <button onClick={() => !createdAsset && setIsCreatingCategory(false)} disabled={!!createdAsset} className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={categoryId}
                        disabled={!!createdAsset}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button type="button" disabled={!!createdAsset} onClick={() => setIsCreatingCategory(true)} className="text-xs whitespace-nowrap text-blue-400 hover:text-blue-300 disabled:opacity-50">
                        + New
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Priority</label>
                  <select
                    value={priority}
                    disabled={!!createdAsset}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="1">1 - Critical</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Normal</option>
                    <option value="5">5 - Low</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Asset Type</label>
                  <input
                    type="text"
                    value={assetType}
                    disabled={!!createdAsset}
                    placeholder="e.g. Character, Prop, BG"
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Workflow</label>
                  <select
                    value={workflow}
                    disabled={!!createdAsset}
                    onChange={(e) => setWorkflow(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  disabled={!!createdAsset}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); handleFilesAdded(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center transition-colors hover:border-blue-500 cursor-pointer"
              >
                <UploadCloud className="mb-4 h-10 w-10 text-zinc-500" />
                <p className="mb-1 text-sm font-bold text-white">Drag and drop files here</p>
                <p className="text-xs text-zinc-500">Supports PSD, PNG, MP4, BLEND, and more</p>
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

              {files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-zinc-500">Upload Queue</h3>
                  {files.map((file) => (
                    <div key={file.id} className="flex flex-col rounded border border-zinc-800 bg-zinc-900 p-3 gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileIcon className="h-5 w-5 text-zinc-500 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-zinc-200 truncate">{file.file.name}</span>
                            <span className="text-xs text-zinc-500">
                              {file.file.name.includes('.') ? "." + file.file.name.split('.').pop()?.toLowerCase() : "unknown"} • 
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {file.isPreview ? (
                            <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/50">
                              Asset Preview
                            </span>
                          ) : PREVIEW_EXTENSIONS.includes(file.file.name.includes('.') ? "." + file.file.name.split('.').pop()?.toLowerCase() : "") ? (
                            <button onClick={() => setAsPreview(file.id)} className="text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400 px-2 py-1 rounded hover:bg-zinc-700 hover:text-white">
                              Use as Preview
                            </button>
                          ) : null}

                          {file.progress.status === "Queued" || file.progress.status === "Failed" || file.progress.status === "Cancelled" ? (
                            <button onClick={() => removeFile(file.id)} className="text-xs text-zinc-500 hover:text-zinc-300 ml-2">
                              Remove
                            </button>
                          ) : file.progress.status === "Complete" ? (
                            <span className="text-xs text-green-500 flex items-center gap-1 ml-2">
                              <CheckCircle2 className="h-3 w-3" /> Complete
                            </span>
                          ) : (
                            <button onClick={() => cancelUpload(file.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-2">
                              <XCircle className="h-3 w-3" /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            file.progress.status === "Failed" ? "bg-red-500" :
                            file.progress.status === "Complete" ? "bg-green-500" :
                            "bg-blue-500"
                          }`} 
                          style={{ width: `${file.progress.percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>{file.progress.status}</span>
                        {file.progress.error ? (
                          <span className="text-red-400">{file.progress.error}</span>
                        ) : (
                          <span>{file.progress.percentage}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "assembly" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                You can assemble this asset into the production hierarchy after creation via the Asset Assembly view.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#2a2a2a] p-6">
          <button
            type="button"
            onClick={() => !isUploading && onClose()}
            className="rounded px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-50"
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? "Processing..." : createdAsset ? "Retry Uploads" : "Create Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-bold transition-colors ${
        active ? "border-b-2 border-white text-white" : "border-b-2 border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
