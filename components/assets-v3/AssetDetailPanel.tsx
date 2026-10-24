"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  MoreVertical,
  ExternalLink,
  Download,
  Trash2,
  Image as ImageIcon,
  File as FileIcon,
  FileText,
  Film,
  Music,
  Archive,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PlaceholderArt, ConfirmDialog } from "@/components/app-shell";
import { Select, type SelectOption } from "@/components/app-shell/Select";
import { formatBytes } from "@/lib/format/production";
import { assetPreviewSrc } from "@/lib/format/assets";
import {
  updateAssetTaskStatus,
  updateAssetTask,
  listAssetFiles,
} from "@/app/actions/production";
import { uploadAssetFile } from "@/lib/google-drive-client";
import type {
  AssetV2,
  AssetBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";
import type { AssetFileV2 } from "@/lib/data/v2/productionRepositoryV2";

export interface AssetDetailPanelProps {
  asset: AssetV2 | null;
  tasks: AssetBoardTask[];
  fileStats?: { fileCount: number; totalBytes: number };
  workflowOptions: Record<string, TaskStatusOption[]>;
  assignableUsers: AssignableUser[];
  scopeLabel?: string;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: AssetBoardTask) => void;
}

interface UploadingFileItem {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

function getFileIcon(name: string, mime?: string | null) {
  const m = mime?.toLowerCase() || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (m.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <ImageIcon size={16} className="text-[var(--po-ink-2)]" />;
  }
  if (m.startsWith("video/") || ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) {
    return <Film size={16} className="text-[var(--po-ink-2)]" />;
  }
  if (m.startsWith("audio/") || ["mp3", "wav", "ogg", "aac", "flac"].includes(ext)) {
    return <Music size={16} className="text-[var(--po-ink-2)]" />;
  }
  if (m.includes("pdf") || m.includes("text") || ["txt", "md", "doc", "docx", "pdf"].includes(ext)) {
    return <FileText size={16} className="text-[var(--po-ink-2)]" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <Archive size={16} className="text-[var(--po-ink-2)]" />;
  }
  return <FileIcon size={16} className="text-[var(--po-ink-2)]" />;
}

function isImageFile(name: string, mime?: string | null): boolean {
  const m = mime?.toLowerCase() || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return (
    m.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)
  );
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export const AssetDetailPanel: React.FC<AssetDetailPanelProps> = ({
  asset,
  tasks: initialTasks,
  workflowOptions,
  assignableUsers,
  scopeLabel,
  onClose,
  onTaskUpdated,
}) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<AssetBoardTask[]>(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState<AssetBoardTask[]>(initialTasks);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Files state
  const [files, setFiles] = useState<AssetFileV2[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFileItem[]>([]);
  const [openMenuFileId, setOpenMenuFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<AssetFileV2 | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [settingPreviewFileId, setSettingPreviewFileId] = useState<string | null>(null);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [prevAssetId, setPrevAssetId] = useState<string | null>(asset?.id ?? null);
  const [isDragging, setIsDragging] = useState(false);

  const currentAssetId = asset?.id ?? null;

  // Clear preview override and sync tasks when asset changes
  if (currentAssetId !== prevAssetId) {
    setPrevAssetId(currentAssetId);
    setPreviewOverride(null);
    setTasks(initialTasks);
    setPrevInitialTasks(initialTasks);
  } else if (asset && initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const previewUrl = previewOverride ?? asset?.previewUrl ?? null;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load files when asset changes
  const assetId = asset?.id;
  useEffect(() => {
    if (!assetId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiles([]);
      return;
    }
    let cancelled = false;
    setIsLoadingFiles(true);
    listAssetFiles(assetId)
      .then((res) => {
        if (!cancelled) setFiles(res);
      })
      .catch((err: unknown) => {
        console.error("Failed to load asset files:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFiles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  // Handle Escape key
  useEffect(() => {
    if (!asset) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openMenuFileId) {
          setOpenMenuFileId(null);
          return;
        }
        if (fileToDelete) {
          setFileToDelete(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [asset, onClose, openMenuFileId, fileToDelete]);

  // Dismiss context menu on document click
  useEffect(() => {
    if (!openMenuFileId) return;
    const handleClick = () => setOpenMenuFileId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [openMenuFileId]);

  // Assignee options for Select
  const assigneeOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      {
        value: "__unassigned__",
        label: "Unassigned",
        avatarInitials: "-",
      },
      ...assignableUsers.map((u) => {
        const parts = u.displayName.trim().split(/\s+/);
        const initials =
          parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : (u.displayName.slice(0, 2) || "U").toUpperCase();
        return {
          value: u.displayName,
          label: u.displayName,
          avatarInitials: initials,
        };
      }),
    ];
    return opts;
  }, [assignableUsers]);

  // Handle task status update with optimistic update and rollback
  const handleStatusChange = useCallback(
    async (task: AssetBoardTask, newDefinitionId: string) => {
      if (!task.taskStatusWorkflowId) return;
      const opts = workflowOptions[task.taskStatusWorkflowId] || [];
      const newOpt = opts.find((o) => o.id === newDefinitionId);
      if (!newOpt) return;

      const prevTask = { ...task };
      const optimisticTask: AssetBoardTask = {
        ...task,
        taskStatusDefinitionId: newOpt.id,
        status: newOpt.name,
      };

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? optimisticTask : t))
      );
      if (onTaskUpdated) onTaskUpdated(optimisticTask);

      try {
        setErrorMessage(null);
        await updateAssetTaskStatus(task.id, newDefinitionId);
      } catch (err: unknown) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? prevTask : t))
        );
        if (onTaskUpdated) onTaskUpdated(prevTask);
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Failed to update status for ${task.taskName}: ${msg}`);
      }
    },
    [workflowOptions, onTaskUpdated]
  );

  // Handle task assignee update with optimistic update and rollback
  const handleAssigneeChange = useCallback(
    async (task: AssetBoardTask, newAssigneeValue: string) => {
      const newAssignee =
        newAssigneeValue === "__unassigned__" ? null : newAssigneeValue;

      const prevTask = { ...task };
      const optimisticTask: AssetBoardTask = {
        ...task,
        assignee: newAssignee,
      };

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? optimisticTask : t))
      );
      if (onTaskUpdated) onTaskUpdated(optimisticTask);

      try {
        setErrorMessage(null);
        await updateAssetTask(task.id, { assignee: newAssignee });
      } catch (err: unknown) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? prevTask : t))
        );
        if (onTaskUpdated) onTaskUpdated(prevTask);
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(
          `Failed to update assignee for ${task.taskName}: ${msg}`
        );
      }
    },
    [onTaskUpdated]
  );

  // Upload handlers
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    if (!asset) return;
    const newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;

    const queueItems: UploadingFileItem[] = newFiles.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      progress: 0,
    }));

    setUploadingFiles((prev) => [...prev, ...queueItems]);

    for (const item of queueItems) {
      try {
        await uploadAssetFile({
          assetId: asset.id,
          file: item.file,
          destination: "Source",
          onProgress: (p) => {
            setUploadingFiles((prev) =>
              prev.map((u) =>
                u.id === item.id ? { ...u, progress: p.percentage } : u
              )
            );
          },
        });
        setUploadingFiles((prev) => prev.filter((u) => u.id !== item.id));
        const updated = await listAssetFiles(asset.id);
        setFiles(updated);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setUploadingFiles((prev) =>
          prev.map((u) =>
            u.id === item.id ? { ...u, error: msg || "Upload failed" } : u
          )
        );
      }
    }
  };

  const handleOpenInDrive = (file: AssetFileV2) => {
    if (!asset) return;
    setOpenMenuFileId(null);
    window.open(`/api/assets/${asset.id}/files/${file.id}/open`, "_blank");
  };

  const handleDownload = (file: AssetFileV2) => {
    if (!asset) return;
    setOpenMenuFileId(null);
    window.open(`/api/assets/${asset.id}/files/${file.id}/download`, "_blank");
  };

  const handleSetPreview = async (file: AssetFileV2) => {
    if (!asset || !file.driveFileId) return;
    setOpenMenuFileId(null);
    setSettingPreviewFileId(file.id);
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/assets/${asset.id}/set-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveFileId: file.driveFileId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to set asset preview");
      }
      setPreviewOverride(file.driveFileId);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Failed to set preview: ${msg}`);
    } finally {
      setSettingPreviewFileId(null);
    }
  };

  const handlePromptRemove = (file: AssetFileV2) => {
    setOpenMenuFileId(null);
    setFileToDelete(file);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || !asset) return;
    setIsDeletingFile(true);
    try {
      setErrorMessage(null);
      const res = await fetch(
        `/api/assets/${asset.id}/files/${fileToDelete.id}/trash`,
        {
          method: "POST",
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove file");
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Failed to remove file: ${msg}`);
    } finally {
      setIsDeletingFile(false);
    }
  };

  if (!asset) return null;

  const totalBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const previewSrc = assetPreviewSrc({ id: asset.id, previewUrl });

  return (
    <>
      {/* Backdrop for outside click dismissal */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Container (560px) */}
      <aside
        role="dialog"
        aria-label={`Details for ${asset.name}`}
        aria-modal="true"
        className="fixed top-3 right-3 bottom-3 z-50 flex w-[560px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[24px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-lg)] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--po-line)] px-5">
          <span className="text-[13px] font-semibold tracking-tight text-[var(--po-ink-3)] uppercase">
            Asset Details
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--po-ink-3)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Inline Error Notice */}
        {errorMessage && (
          <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-[#E5534B]/30 bg-[#E5534B]/10 p-3 text-[12px] text-[#E5534B]">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="hover:opacity-75"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Two-Column Top Preview & Meta Layout */}
          <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4.5">
            {/* Preview Thumbnail */}
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-[14px] border border-[var(--po-line)] bg-[var(--po-sunken)] shadow-inner">
              <PlaceholderArt
                seed={asset.id}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={asset.name}
                  key={previewSrc}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>

            {/* Asset Meta Info */}
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="text-[20px] font-bold tracking-tight text-[var(--po-ink)]">
                {asset.name}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                {asset.assetCode && (
                  <span className="rounded-md border border-[var(--po-line)] bg-[var(--po-chip)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--po-ink)]">
                    {asset.assetCode}
                  </span>
                )}
                {asset.category && (
                  <span className="font-medium text-[var(--po-ink-2)]">
                    {asset.category}
                  </span>
                )}
                {asset.priority && (
                  <>
                    <span className="text-[var(--po-ink-3)]">·</span>
                    <span className="font-medium text-[var(--po-ink-2)]">
                      {asset.priority}
                    </span>
                  </>
                )}
                {scopeLabel && (
                  <>
                    <span className="text-[var(--po-ink-3)]">·</span>
                    <span className="text-[var(--po-ink-3)]">{scopeLabel}</span>
                  </>
                )}
              </div>

              {asset.description && (
                <p className="pt-1 text-[13px] leading-relaxed text-[var(--po-ink-2)]">
                  {asset.description}
                </p>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-3 pt-2 border-t border-[var(--po-line)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--po-ink-3)] uppercase tracking-wider">
                Tasks ({tasks.length})
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--po-line)] p-4 text-center text-[13px] text-[var(--po-ink-3)]">
                No tasks assigned to this asset yet.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const wfId = task.taskStatusWorkflowId;
                  const opts = wfId ? workflowOptions[wfId] || [] : [];
                  const selectOptions: SelectOption[] = opts.map((opt) => ({
                    value: opt.id,
                    label: opt.name,
                    colour: opt.colour,
                  }));

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-2 rounded-[14px] border border-[var(--po-line)] bg-[var(--po-sunken)]/60 p-3"
                    >
                      {/* Task Process Title & Dot */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {task.processColour && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: task.processColour }}
                            />
                          )}
                          <span className="truncate text-[13px] font-semibold text-[var(--po-ink)]">
                            {task.taskName}
                          </span>
                        </div>
                        {task.processName && (
                          <span className="shrink-0 text-[11px] font-medium text-[var(--po-ink-3)]">
                            {task.processName}
                          </span>
                        )}
                      </div>

                      {/* Dropdowns Row: Status & Assignee */}
                      <div className="flex items-center gap-2 pt-1">
                        {/* Status Select */}
                        <div className="flex-1 min-w-0">
                          {wfId && selectOptions.length > 0 ? (
                            <Select
                              value={task.taskStatusDefinitionId}
                              options={selectOptions}
                              onChange={(val) => handleStatusChange(task, val)}
                              ariaLabel={`Status for ${task.taskName}`}
                              size="sm"
                            />
                          ) : (
                            <span className="inline-flex h-[32px] w-full items-center rounded-lg border border-[var(--po-line)] bg-[var(--po-card)] px-2.5 text-[12px] font-medium text-[var(--po-ink-2)]">
                              {task.status || "Not Started"}
                            </span>
                          )}
                        </div>

                        {/* Assignee Select */}
                        <div className="flex-1 min-w-0">
                          <Select
                            value={task.assignee || "__unassigned__"}
                            options={assigneeOptions}
                            onChange={(val) => handleAssigneeChange(task, val)}
                            ariaLabel={`Assignee for ${task.taskName}`}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drive Files Section */}
          <div
            className="space-y-2.5 pt-2 border-t border-[var(--po-line)]"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleUploadFiles(e.dataTransfer.files);
              }
            }}
          >
            {/* Files Header */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[var(--po-ink-3)] uppercase tracking-wider">
                Files
              </span>
              <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-2)]">
                {files.length}
              </span>
              {files.length > 0 && (
                <span className="text-[12px] text-[var(--po-ink-3)]">
                  {formatBytes(totalBytes)}
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--po-line-2)] bg-transparent px-3 text-[12px] font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)]"
                >
                  <Upload size={13} />
                  Upload files
                </button>
              </div>
            </div>

            {/* Hidden native input */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUploadFiles(e.target.files);
                  e.target.value = "";
                }
              }}
              className="hidden"
            />

            {/* Empty State */}
            {files.length === 0 &&
              uploadingFiles.length === 0 &&
              !isLoadingFiles && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex h-[156px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed transition-colors p-4 text-center ${
                    isDragging
                      ? "border-[var(--po-accent)] bg-[var(--po-accent)]/5"
                      : "border-[var(--po-line)] bg-[var(--po-sunken)] hover:border-[var(--po-accent)]/50"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--po-chip)] text-[var(--po-accent)] shadow-xs">
                    <Upload size={18} />
                  </span>
                  <span className="text-[13px] font-medium text-[var(--po-ink)]">
                    {isDragging ? (
                      <span className="font-semibold text-[var(--po-accent)]">
                        Drop to upload
                      </span>
                    ) : (
                      <>
                        No files yet — drag files here or{" "}
                        <span className="font-semibold text-[var(--po-accent)]">
                          browse
                        </span>
                      </>
                    )}
                  </span>
                  <span className="text-[12px] text-[var(--po-ink-3)]">
                    Stored in the project’s Google Drive folder
                  </span>
                </div>
              )}

            {/* Loading indicator */}
            {isLoadingFiles && files.length === 0 && (
              <div className="flex h-24 items-center justify-center gap-2 rounded-xl border border-[var(--po-line)] bg-[var(--po-sunken)]/40 text-[13px] text-[var(--po-ink-3)]">
                <Loader2 size={16} className="animate-spin" />
                Loading files...
              </div>
            )}

            {/* File List */}
            {(files.length > 0 || uploadingFiles.length > 0) && (
              <div
                className={`flex flex-col gap-1 rounded-[14px] border-[1.5px] p-1 ${
                  isDragging
                    ? "border-dashed border-[var(--po-accent)] bg-[var(--po-accent)]/5"
                    : "border-solid border-[var(--po-line)] bg-[var(--po-sunken)]"
                }`}
              >
                {/* Active Uploads */}
                {uploadingFiles.map((up) => (
                  <div
                    key={up.id}
                    className="grid grid-cols-[34px_minmax(0,1fr)_auto_32px] items-center gap-3 rounded-[10px] bg-[var(--po-card)] p-2"
                  >
                    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--po-chip)] text-[var(--po-ink-2)]">
                      {getFileIcon(up.file.name, up.file.type)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-[13px] font-medium text-[var(--po-ink)]">
                        {up.file.name}
                      </span>
                      {up.error ? (
                        <span className="text-[11px] text-[#E5534B]">
                          {up.error}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 overflow-hidden rounded-full bg-[var(--po-chip)]">
                            <div
                              className="h-full bg-[var(--po-accent)] transition-all duration-150"
                              style={{ width: `${up.progress}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-[11px] text-[var(--po-ink-3)]">
                            {up.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[12px] text-[var(--po-ink-2)]">
                      {formatBytes(up.file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadingFiles((prev) =>
                          prev.filter((u) => u.id !== up.id)
                        )
                      }
                      aria-label="Dismiss upload"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--po-ink-3)] hover:bg-[var(--po-chip)]"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}

                {/* Completed Files */}
                {files.map((file) => {
                  const isImage = isImageFile(file.name, file.mimeType);
                  const isMenuOpen = openMenuFileId === file.id;
                  const isSettingPreview = settingPreviewFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className="relative grid grid-cols-[34px_minmax(0,1fr)_auto_32px] items-center gap-3 rounded-[10px] bg-[var(--po-card)] p-2"
                    >
                      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--po-chip)] text-[var(--po-ink-2)]">
                        {getFileIcon(file.name, file.mimeType)}
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[13px] font-medium text-[var(--po-ink)]">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-[var(--po-ink-3)]">
                          {formatDate(file.createdAt)}
                          {file.role ? ` · ${file.role}` : ""}
                        </span>
                      </div>
                      <span className="font-mono text-[12px] text-[var(--po-ink-2)]">
                        {formatBytes(file.sizeBytes)}
                      </span>

                      {/* File action menu trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuFileId(isMenuOpen ? null : file.id);
                        }}
                        aria-label="File actions"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--po-ink-2)] hover:bg-[var(--po-chip)]"
                      >
                        {isSettingPreview ? (
                          <Loader2 size={15} className="animate-spin text-[var(--po-accent)]" />
                        ) : (
                          <MoreVertical size={16} />
                        )}
                      </button>

                      {/* Context Menu Dropdown */}
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-11 z-20 flex w-48 flex-col gap-0.5 rounded-[14px] border border-[var(--po-line)] bg-[var(--po-card)] p-1.5 shadow-[var(--po-shadow-lg)]"
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenInDrive(file)}
                            className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors"
                          >
                            <ExternalLink size={14} className="text-[var(--po-ink-3)]" />
                            Open in Drive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors"
                          >
                            <Download size={14} className="text-[var(--po-ink-3)]" />
                            Download
                          </button>
                          {isImage && (
                            <button
                              type="button"
                              onClick={() => handleSetPreview(file)}
                              className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors"
                            >
                              <ImageIcon size={14} className="text-[var(--po-ink-3)]" />
                              Set as preview
                            </button>
                          )}
                          <div className="my-1 h-[1px] bg-[var(--po-line)]" />
                          <button
                            type="button"
                            onClick={() => handlePromptRemove(file)}
                            className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium text-[var(--po-danger)] hover:bg-[var(--po-danger)]/10 transition-colors"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!fileToDelete}
        title="Remove file"
        description={`Are you sure you want to remove "${fileToDelete?.name}"? This file will be moved to Google Drive trash.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingFile}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </>
  );
};
