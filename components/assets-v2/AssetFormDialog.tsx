"use client";

import React, { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { createAssetV2 } from "@/app/actions/production";
import type { AssetV2, ProjectV2 } from "@/types/production-v2";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type AssetFormDialogProps = {
  isOpen: boolean;
  projects?: ProjectV2[];
  defaultProjectId?: string | null;
  defaultEpisodeId?: string | null;
  onClose: () => void;
  onSuccess: (newAsset: AssetV2) => void;
};

export const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
  isOpen,
  projects = [],
  defaultProjectId = null,
  defaultEpisodeId = null,
  onClose,
  onSuccess,
}) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [name, setName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !isClient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Asset name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const newAsset = await createAssetV2({
        name: name.trim(),
        assetCode: assetCode.trim() || undefined,
        category,
        priority,
        projectId: projectId || null,
        episodeId: defaultEpisodeId || null,
        description: description.trim() || undefined,
        previewUrl: previewUrl.trim() || undefined,
      });

      onSuccess(newAsset);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs font-sans"
    >
      <div className="w-[500px] bg-[var(--color-canvas,#ffffff)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] shadow-2xl p-6 flex flex-col gap-4 text-[var(--color-ink,#000000)] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex flex-row items-center justify-between pb-2 border-b border-[var(--color-line-soft,#a9a9a9)]">
          <h2 id="asset-dialog-title" className="text-[var(--text-section,18px)] font-bold">
            Create New Asset
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-[18px] font-mono cursor-pointer hover:opacity-60"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-[11px] font-mono bg-red-100 border border-red-400 text-red-700 rounded-[var(--radius-xs,1px)]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-[var(--text-list,12px)]">
          <div className="flex flex-col gap-1">
            <label htmlFor="asset-name-input" className="font-medium">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              id="asset-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hero Character Main"
              className="px-3 py-1.5 border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="asset-code-input" className="font-medium">Asset Code</label>
              <input
                id="asset-code-input"
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="AST-001"
                className="px-3 py-1.5 border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black font-mono text-[11px]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="asset-category-select" className="font-medium">Category</label>
              <select
                id="asset-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1.5 border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black"
              >
                <option value="Character">Character</option>
                <option value="Prop">Prop</option>
                <option value="Environment">Environment</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="asset-priority-select" className="font-medium">Priority</label>
              <select
                id="asset-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-3 py-1.5 border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="asset-project-select" className="font-medium">Destination Project</label>
              <select
                id="asset-project-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-1.5 border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black"
              >
                <option value="">(Default: Unknown System Project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isSystem ? "★ Unknown (System)" : p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="asset-preview-url-input" className="font-medium">Preview Image URL</label>
            <input
              id="asset-preview-url-input"
              type="url"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="https://..."
              className="px-3 py-1.5 border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black font-mono text-[11px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="asset-description-textarea" className="font-medium">Description</label>
            <textarea
              id="asset-description-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Asset notes or usage description..."
              className="px-3 py-1.5 border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black resize-none text-[11px]"
            />
          </div>

          <div className="flex flex-row items-center justify-end gap-3 pt-3 border-t border-[var(--color-line-soft,#a9a9a9)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[var(--radius-sm,3px)] border border-[var(--color-line,#000000)] font-medium cursor-pointer hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 rounded-[var(--radius-sm,3px)] bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] font-medium cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? "Creating..." : "Create Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AssetFormDialog;
