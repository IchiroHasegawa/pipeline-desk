"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  HardDrive,
  X,
  RefreshCw,
  Check,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  File as FileIcon,
} from "lucide-react";

export type UploadFileStatus = "queued" | "uploading" | "complete" | "error";

export interface UploadFileItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  status: UploadFileStatus;
  progress?: number;
  error?: string | null;
}

export interface FileUploadListProps {
  files: UploadFileItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

export function getFileIcon(fileName: string) {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "psd"].includes(ext)) {
    return FileImage;
  }
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return FileVideo;
  }
  if (["mp3", "wav", "aac", "ogg", "flac"].includes(ext)) {
    return FileAudio;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return FileArchive;
  }
  if (["js", "ts", "tsx", "jsx", "json", "html", "css", "py"].includes(ext)) {
    return FileCode;
  }
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) {
    return FileText;
  }
  return FileIcon;
}

export const FileUploadList: React.FC<FileUploadListProps> = ({
  files,
  onAdd,
  onRemove,
  onRetry,
  disabled = false,
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      onAdd(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      onAdd(selectedFiles);
    }
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
    <div className={`flex flex-col gap-2 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Multi-file drop target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerBrowse}
        className={`flex items-center gap-3 p-3.5 rounded-[14px] border-[1.5px] border-dashed transition-all duration-150 select-none cursor-pointer ${
          isDragOver
            ? "border-[var(--po-accent)] bg-[color-mix(in_oklch,var(--po-accent)_9%,var(--po-card))]"
            : "border-[var(--po-line-2)] hover:border-[var(--po-line)] bg-[var(--po-sunken)] hover:bg-[var(--po-card)]"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] shadow-xs transition-colors ${
            isDragOver
              ? "bg-[var(--po-accent)] text-white"
              : "bg-[var(--po-card)] text-[var(--po-ink-2)]"
          }`}
        >
          <Upload size={16} />
        </span>
        <div className="flex flex-col min-w-0">
          {isDragOver ? (
            <span className="text-[13px] font-semibold text-[var(--po-accent)]">
              Drop files to add them
            </span>
          ) : (
            <>
              <span className="text-[13px] font-medium text-[var(--po-ink)]">
                Drag files here or{" "}
                <span className="font-semibold text-[var(--po-accent)]">
                  browse
                </span>
              </span>
              <span className="text-[11px] text-[var(--po-ink-3)]">
                Any file type · up to 2 GB each
              </span>
            </>
          )}
        </div>
      </div>

      {/* Files list rows */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
          {files.map((fileItem) => {
            const Icon = getFileIcon(fileItem.name);
            const isUp = fileItem.status === "uploading";
            const isDone = fileItem.status === "complete";
            const isFail = fileItem.status === "error";

            return (
              <div
                key={fileItem.id}
                className={`grid grid-cols-[32px_minmax(0,1fr)_28px] gap-2.5 items-center p-2 rounded-[10px] border transition-colors ${
                  isFail
                    ? "border-[var(--po-danger)]/30 bg-[color-mix(in_oklch,var(--po-danger)_7%,transparent)]"
                    : "border-[var(--po-line)] bg-[var(--po-card)]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--po-chip)] shrink-0 ${
                    isFail ? "text-[var(--po-danger)]" : "text-[var(--po-ink-2)]"
                  }`}
                >
                  <Icon size={15} />
                </span>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 min-w-0">
                    <span className="truncate text-[12.5px] font-medium text-[var(--po-ink)]">
                      {fileItem.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-[var(--po-ink-3)] tabular-nums">
                      {formatFileSize(fileItem.sizeBytes)}
                    </span>
                  </div>

                  {isUp && (
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--po-chip)]">
                        <div
                          className="h-full bg-[var(--po-accent)] transition-all duration-150 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, fileItem.progress || 0))}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] text-[var(--po-ink-3)] tabular-nums">
                        {Math.round(fileItem.progress || 0)}%
                      </span>
                    </div>
                  )}

                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#2FA36B] font-medium">
                      <Check size={12} strokeWidth={2.5} />
                      Uploaded
                    </span>
                  )}

                  {isFail && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--po-danger)]">
                      <span className="truncate">
                        {fileItem.error || "Upload failed"}
                      </span>
                      {onRetry && (
                        <button
                          type="button"
                          onClick={() => onRetry(fileItem.id)}
                          className="inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--po-accent)] hover:underline cursor-pointer"
                        >
                          <RefreshCw size={11} />
                          Retry
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(fileItem.id)}
                  aria-label="Remove file"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--po-ink-3)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--po-ink-3)]">
        <HardDrive size={13} className="shrink-0" />
        Files are stored in the project’s Google Drive folder.
      </span>
    </div>
  );
};

export default FileUploadList;
