"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative flex w-full max-w-[420px] flex-col gap-4 rounded-[22px] border border-[var(--po-line)] bg-[var(--po-card)] p-6 shadow-[var(--po-shadow-lg)]"
        style={{
          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        }}
      >
        {/* Close icon button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--po-chip)] text-[var(--po-ink-2)] transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <X size={15} />
        </button>

        {/* Warning/Info Icon and Title */}
        <div className="flex items-start gap-3">
          {variant === "danger" ? (
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#E5534B]/15 text-[#E5534B]">
              <AlertTriangle size={20} />
            </div>
          ) : (
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--po-chip)] text-[var(--po-accent)]">
              <AlertTriangle size={20} />
            </div>
          )}
          <div className="flex flex-col gap-1 pr-6">
            <h2
              id="confirm-dialog-title"
              className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-[var(--po-ink)]"
            >
              {title}
            </h2>
            {description && (
              <p className="m-0 text-[13px] leading-[1.5] text-[var(--po-ink-2)]">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-[36px] cursor-pointer items-center justify-center rounded-full border border-[var(--po-line-2)] bg-transparent px-4 text-[13px] font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex h-[36px] cursor-pointer items-center justify-center gap-2 rounded-full border-none px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              variant === "danger"
                ? "bg-[#E5534B]"
                : "bg-[var(--po-accent)] text-white"
            }`}
          >
            <span>{isLoading ? "Processing..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
