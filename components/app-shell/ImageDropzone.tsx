"use client";

import React, { useRef, useState } from "react";
import {
  ImagePlus,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
  Check,
} from "lucide-react";

export type ImageDropzoneState = "idle" | "uploading" | "done" | "error";

export interface ImageDropzoneProps {
  value?: string | null;
  fileName?: string | null;
  onFile?: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
  disabledNote?: string;
  state?: ImageDropzoneState;
  progress?: number;
  error?: string | null;
  className?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  value = null,
  fileName = null,
  onFile,
  onRemove,
  disabled = false,
  disabledNote,
  state: controlledState,
  progress = 0,
  error = null,
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive active state: if controlledState is provided, use it;
  // otherwise, if error is present => error; if value => done; else idle.
  const state: ImageDropzoneState =
    controlledState ??
    (error ? "error" : value ? "done" : "idle");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && onFile) {
      if (!file.type.startsWith("image/")) {
        return;
      }
      onFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFile) {
      onFile(file);
    }
    // Reset input value so re-selecting same file triggers change
    e.target.value = "";
  };

  const triggerBrowse = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* 1. Empty / Idle state */}
      {state === "idle" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={disabled ? undefined : triggerBrowse}
          className={`aspect-16/9 w-full rounded-[16px] border-[1.5px] border-dashed transition-all duration-150 flex flex-col items-center justify-center gap-2.5 p-4 text-center select-none ${
            disabled
              ? "cursor-not-allowed border-[var(--po-line-2)] bg-[var(--po-sunken)] opacity-60"
              : isDragOver
              ? "cursor-pointer border-[var(--po-accent)] bg-[color-mix(in_oklch,var(--po-accent)_9%,var(--po-card))]"
              : "cursor-pointer border-[var(--po-line-2)] hover:border-[var(--po-line)] bg-[var(--po-sunken)] hover:bg-[var(--po-card)]"
          }`}
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-xs transition-colors ${
              isDragOver
                ? "bg-[var(--po-accent)] text-white"
                : "bg-[var(--po-card)] text-[var(--po-ink-2)]"
            }`}
          >
            <ImagePlus size={20} />
          </span>

          {disabled ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-[var(--po-ink-2)]">
                Image upload disabled
              </span>
              {disabledNote && (
                <span className="text-[11px] text-[var(--po-ink-3)] max-w-[260px] leading-relaxed">
                  {disabledNote}
                </span>
              )}
            </div>
          ) : isDragOver ? (
            <span className="text-[13px] font-semibold text-[var(--po-accent)]">
              Drop to upload
            </span>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-[var(--po-ink)]">
                Drag an image here or{" "}
                <span className="font-semibold text-[var(--po-accent)]">
                  browse
                </span>
              </span>
              <span className="text-[11px] text-[var(--po-ink-3)]">
                PNG, JPG or WebP · up to 20 MB
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Uploading state */}
      {state === "uploading" && (
        <div
          className="relative aspect-16/9 w-full overflow-hidden rounded-[16px] border border-[var(--po-line)] bg-cover bg-center"
          style={{
            backgroundImage: value ? `url("${value}")` : undefined,
            backgroundColor: "var(--po-sunken)",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/60 px-8 text-center text-white backdrop-blur-[2px]">
            <span className="text-[13px] font-medium tabular-nums">
              Uploading · {Math.round(progress)}%
            </span>
            <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full bg-white transition-all duration-150 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            {fileName && (
              <span className="max-w-full truncate text-[11px] text-white/75">
                {fileName}
              </span>
            )}
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label="Cancel upload"
              className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-900 hover:bg-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* 3. Done state */}
      {state === "done" && value && (
        <div
          className="group relative aspect-16/9 w-full overflow-hidden rounded-[16px] border border-[var(--po-line)] bg-cover bg-center bg-[var(--po-sunken)]"
          style={{ backgroundImage: `url("${value}")` }}
        >
          <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-1.5">
            {fileName && (
              <span className="inline-flex h-[30px] max-w-[130px] items-center gap-1.5 truncate rounded-full bg-white/95 px-2.5 text-[12px] font-medium text-neutral-900 shadow-xs backdrop-blur-xs">
                <Check size={13} className="text-[#2FA36B] shrink-0" strokeWidth={2.5} />
                <span className="truncate">{fileName}</span>
              </span>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={triggerBrowse}
              className="inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[12px] font-medium text-neutral-900 shadow-xs hover:bg-white transition-colors cursor-pointer backdrop-blur-xs"
            >
              <RefreshCw size={12} />
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[12px] font-medium text-neutral-900 shadow-xs hover:bg-white transition-colors cursor-pointer backdrop-blur-xs"
              >
                <Trash2 size={12} />
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Error state */}
      {state === "error" && (
        <div className="aspect-16/9 w-full rounded-[16px] border-[1.5px] border-dashed border-[var(--po-danger)] bg-[color-mix(in_oklch,var(--po-danger)_6%,var(--po-card))] flex flex-col items-center justify-center gap-2 p-4 text-center box-border">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--po-danger)_14%,transparent)] text-[var(--po-danger)]">
            <AlertCircle size={20} />
          </span>
          <span className="text-[13px] font-semibold text-[var(--po-ink)]">
            Upload failed
          </span>
          {error && (
            <span className="text-[12px] text-[var(--po-ink-2)] max-w-[280px] leading-tight">
              {error}
            </span>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={triggerBrowse}
              className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-[var(--po-ink)] px-3 text-[12px] font-medium text-[var(--po-panel)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RefreshCw size={12} />
              Retry
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="inline-flex h-[30px] items-center rounded-full border border-[var(--po-line-2)] bg-transparent px-3 text-[12px] font-medium text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;
