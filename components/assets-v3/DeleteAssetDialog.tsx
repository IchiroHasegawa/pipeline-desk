"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { deleteAssetV2 } from "@/app/actions/production";
import type { AssetV2 } from "@/types/production-v2";

export interface DeleteAssetDialogProps {
  isOpen: boolean;
  asset: AssetV2 | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteAssetDialog: React.FC<DeleteAssetDialogProps> = ({
  isOpen,
  asset,
  onClose,
  onDeleted,
}) => {
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const targetName = asset.name;
  const isMatch = typedName.trim() === targetName.trim();

  const handleDelete = async () => {
    if (!isMatch || isDeleting) return;

    try {
      setIsDeleting(true);
      setErrorMsg(null);
      await deleteAssetV2(asset.id);
      setTypedName("");
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-asset-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md rounded-[24px] border border-[var(--po-line)] bg-[var(--po-card)] p-6 shadow-[var(--po-shadow-lg)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5534B]/10 text-[#E5534B]">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 id="delete-asset-title" className="text-[17px] font-semibold text-[var(--po-ink)]">
                Delete Asset
              </h3>
              <p className="text-[13px] text-[var(--po-ink-3)]">
                {asset.assetCode ? `${asset.assetCode} · ` : ""}{asset.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--po-ink-3)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#E5534B]/30 bg-[#E5534B]/10 p-3 text-[13px] text-[#E5534B]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <p className="text-[14px] leading-relaxed text-[var(--po-ink-2)]">
          Delete <strong className="text-[var(--po-ink)] font-semibold">{targetName}</strong>? This
          permanently deletes its tasks, file records, project and episode links, and removes it from
          every scene assembly board. Files already in Google Drive are not deleted.
        </p>

        <div className="space-y-1.5 pt-1">
          <label className="text-[12px] font-medium text-[var(--po-ink-3)]">
            Type <span className="font-semibold text-[var(--po-ink)] select-all">{targetName}</span> to confirm:
          </label>
          <input
            autoFocus
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={targetName}
            className="w-full rounded-xl border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3.5 py-2.5 text-[14px] text-[var(--po-ink)] outline-none focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 transition-all placeholder:text-[var(--po-ink-3)]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="h-9 px-4 rounded-full border border-[var(--po-line-2)] text-[13px] font-medium text-[var(--po-ink-2)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            className="inline-flex h-9 items-center justify-center gap-2 px-5 rounded-full bg-[#E5534B] text-[13px] font-semibold text-white shadow-sm hover:bg-[#d84a42] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
