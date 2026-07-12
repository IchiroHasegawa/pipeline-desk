"use client";

import { useState } from "react";
import { X, UploadCloud } from "lucide-react";
import type { AssetCategory } from "@/types/production";
import { createAsset, createAssetCategory } from "@/lib/data/productionRepository";

type AssetFormProps = {
  onClose: () => void;
  categories: AssetCategory[];
};

export default function AssetForm({ onClose, categories }: AssetFormProps) {
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
  
  // Fake file mock states
  const [files, setFiles] = useState<{name: string, progress: number, format: string}[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    // Simulate upload progress
    const newFiles = droppedFiles.map(f => ({ name: f.name, progress: 0, format: f.name.split('.').pop() || "unknown" }));
    setFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach((file, idx) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setFiles(prev => {
          const updated = [...prev];
          const fileIndex = updated.findIndex(f => f.name === file.name);
          if (fileIndex !== -1) updated[fileIndex].progress = currentProgress;
          return updated;
        });
        if (currentProgress >= 100) clearInterval(interval);
      }, 200 + (idx * 100));
    });
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
      let finalCategoryId = categoryId;
      if (isCreatingCategory && newCategoryName.trim()) {
        const newCat = await createAssetCategory(newCategoryName);
        finalCategoryId = newCat.id;
      }

      await createAsset({
        assetName,
        assetCode,
        description,
        priority,
        categoryId: finalCategoryId || null,
        assetType,
        workflow,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        status: "Active",
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save asset.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg border border-[#2a2a2a] bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] p-6">
          <h2 className="text-xl font-bold text-white">Create Asset</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
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
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Asset Code *</label>
                  <input
                    type="text"
                    required
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 w-full resize-none rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Category</label>
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                      />
                      <button onClick={() => setIsCreatingCategory(false)} className="text-xs text-blue-400 hover:text-blue-300">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                      >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setIsCreatingCategory(true)} className="text-xs whitespace-nowrap text-blue-400 hover:text-blue-300">
                        + New
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
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
                    placeholder="e.g. Character, Prop, BG"
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Workflow</label>
                  <select
                    value={workflow}
                    onChange={(e) => setWorkflow(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
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
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center transition-colors hover:border-blue-500"
              >
                <UploadCloud className="mb-4 h-10 w-10 text-zinc-500" />
                <p className="mb-1 text-sm font-bold text-white">Drag and drop files here</p>
                <p className="text-xs text-zinc-500">Supports PSD, PNG, MP4, BLEND, and more</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-zinc-500">Upload Queue</h3>
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900 p-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{file.name}</span>
                        <span className="text-xs text-zinc-500">{file.format.toUpperCase()}</span>
                      </div>
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>{Math.min(file.progress, 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${Math.min(file.progress, 100)}%` }}
                          />
                        </div>
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
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Asset..." : "Create Asset"}
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
