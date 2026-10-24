"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import { createPortal } from "react-dom";
import { Boxes, X, AlertCircle, Loader2, Link as LinkIcon } from "lucide-react";
import { createAssetV2 } from "@/app/actions/production";
import { createClient } from "@/lib/supabase/client";
import { Select, type SelectOption } from "@/components/app-shell/Select";
import { ImageDropzone, type ImageDropzoneState } from "@/components/app-shell/ImageDropzone";
import {
  FileUploadList,
  type UploadFileItem,
} from "@/components/app-shell/FileUploadList";
import { uploadAssetFile } from "@/lib/google-drive-client";
import type { AssetV2, ProjectV2, EpisodeV2 } from "@/types/production-v2";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "Character", label: "Character" },
  { value: "Prop", label: "Prop" },
  { value: "Background", label: "Background" },
  { value: "FX", label: "FX" },
  { value: "General", label: "General" },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export type AssetFormDialogProps = {
  isOpen: boolean;
  projects?: ProjectV2[];
  assetWorkflows?: Array<{ id: string; name: string }>;
  defaultProjectId?: string | null;
  defaultEpisodeId?: string | null;
  onClose: () => void;
  onSuccess: (newAsset: AssetV2) => void;
};

export const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
  isOpen,
  projects = [],
  assetWorkflows = [],
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
  const [category, setCategory] = useState("Character");
  const [priority, setPriority] = useState("Medium");
  const [projectId, setProjectId] = useState<string>(() => defaultProjectId || (projects[0]?.id || ""));
  const [episodeId, setEpisodeId] = useState<string>(() => defaultEpisodeId || "");
  const [workflowId, setWorkflowId] = useState<string>("");
  const [description, setDescription] = useState("");

  // Preview Image state
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<ImageDropzoneState>("idle");
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Source files state
  const [files, setFiles] = useState<UploadFileItem[]>([]);

  // Submission & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdAsset, setCreatedAsset] = useState<AssetV2 | null>(null);
  const [hasUploadFailed, setHasUploadFailed] = useState(false);

  // Episodes per project cache
  const [episodes, setEpisodes] = useState<EpisodeV2[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync projectId when defaultProjectId prop changes
  useEffect(() => {
    if (defaultProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects, projectId]);

  // Sync episodeId when defaultEpisodeId prop changes
  useEffect(() => {
    if (defaultEpisodeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEpisodeId(defaultEpisodeId);
    }
  }, [defaultEpisodeId]);

  // Load episodes when active projectId changes
  useEffect(() => {
    if (!projectId || !isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEpisodes([]);
      return;
    }

    let cancelled = false;
    async function loadEpisodes() {
      setIsLoadingEpisodes(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("episode_name", { ascending: true });

      if (!cancelled) {
        if (!error && data) {
          setEpisodes(
            data.map((row) => ({
              id: row.id,
              projectId: row.project_id,
              episodeName: row.episode_name,
              code: row.code ?? "",
              description: row.description ?? "",
              previewImage: row.preview_image ?? "",
              startDate: row.start_date ?? null,
              endDate: row.end_date ?? null,
              jobWorkflow: row.job_workflow ?? null,
              sceneWorkflow: row.scene_workflow ?? null,
              status: row.status === "Retired" ? "Retired" : "Active",
              sortOrder: row.sort_order ?? 0,
              createdAt: row.created_at,
            }))
          );
        } else {
          setEpisodes([]);
        }
        setIsLoadingEpisodes(false);
      }
    }

    void loadEpisodes();
    return () => {
      cancelled = true;
    };
  }, [projectId, isOpen]);

  const handleDismiss = useCallback(() => {
    if (createdAsset) {
      onSuccess(createdAsset);
    }
    onClose();
  }, [createdAsset, onSuccess, onClose]);

  // Handle focus & escape
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isSubmitting) {
          handleDismiss();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen, isSubmitting, handleDismiss]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  if (!isClient || !isOpen) return null;

  const handlePreviewFileChosen = (file: File) => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewBlobUrl(blobUrl);
    setPreviewState("done");
    setPreviewError(null);
  };

  const handlePreviewFileRemoved = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewFile(null);
    setPreviewBlobUrl(null);
    setPreviewState("idle");
    setPreviewProgress(0);
    setPreviewError(null);
  };

  const handleAddFiles = (newFiles: File[]) => {
    const items: UploadFileItem[] = newFiles.map((f, i) => ({
      id: "f_" + Date.now() + "_" + i + "_" + Math.random().toString(36).slice(2, 6),
      file: f,
      name: f.name,
      sizeBytes: f.size,
      status: "queued",
      progress: 0,
      error: null,
    }));
    setFiles((prev) => [...prev, ...items]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRetryFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "queued", progress: 0, error: null } : f
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Asset name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setHasUploadFailed(false);

    // Step 1: Create asset record if not already created
    let targetAsset: AssetV2;
    try {
      if (!createdAsset) {
        targetAsset = await createAssetV2({
          name: name.trim(),
          assetCode: assetCode.trim() || undefined,
          category,
          priority,
          projectId: projectId || null,
          episodeId: episodeId || defaultEpisodeId || null,
          description: description.trim() || undefined,
          previewUrl: previewUrl.trim() || undefined,
          workflowId: workflowId || undefined,
        });
        setCreatedAsset(targetAsset);
      } else {
        targetAsset = createdAsset;
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setFormError(err instanceof Error ? err.message : String(err));
      return;
    }

    let uploadHadError = false;

    // Step 2: Upload preview image if chosen as file
    if (previewFile && previewState !== "done") {
      try {
        setPreviewState("uploading");
        setPreviewProgress(0);
        setPreviewError(null);

        const result = await uploadAssetFile({
          assetId: targetAsset.id,
          file: previewFile,
          destination: "Preview",
          onProgress: (p) => {
            setPreviewProgress(p.percentage);
          },
        });

        // Set preview via API
        const setRes = await fetch(`/api/assets/${targetAsset.id}/set-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driveFileId: result.driveFileId }),
        });

        if (!setRes.ok) {
          const errData = await setRes.json().catch(() => null);
          throw new Error(errData?.error || "Failed to set asset preview image");
        }

        setPreviewState("done");
        targetAsset.previewUrl = result.driveFileId;
      } catch (err: unknown) {
        uploadHadError = true;
        setPreviewState("error");
        setPreviewError(err instanceof Error ? err.message : "Preview upload failed");
      }
    }

    // Step 3: Upload each file sequentially with destination "Source"
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === "complete") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading", progress: 0, error: null } : f
        )
      );

      try {
        await uploadAssetFile({
          assetId: targetAsset.id,
          file: item.file,
          destination: "Source",
          onProgress: (p) => {
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progress: p.percentage } : f
              )
            );
          },
        });

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "complete", progress: 100 } : f
          )
        );
      } catch (err: unknown) {
        uploadHadError = true;
        const msg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: msg } : f
          )
        );
      }
    }

    setIsSubmitting(false);

    if (uploadHadError) {
      setHasUploadFailed(true);
      setFormError("One or more files failed to upload. You can retry or close.");
    } else {
      onSuccess(targetAsset);
      onClose();
    }
  };

  const projectOptions: SelectOption[] = projects.map((p) => ({
    value: p.id,
    label: p.title,
  }));

  const episodeOptions: SelectOption[] = [
    { value: "", label: "None — project-level" },
    ...episodes.map((e) => ({ value: e.id, label: e.episodeName })),
  ];

  const workflowOptions: SelectOption[] = [
    { value: "", label: "(None / Default)" },
    ...assetWorkflows.map((w) => ({ value: w.id, label: w.name })),
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleDismiss();
      }}
    >
      <div
        className="w-[1040px] max-w-full max-h-[calc(100vh-48px)] flex flex-col rounded-[26px] border border-[var(--po-line)] bg-[var(--po-card)] text-[var(--po-ink)] shadow-[var(--po-shadow-lg)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 px-6 pt-5 pb-4 border-b border-[var(--po-line)]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--po-chip)] text-[var(--po-ink-2)]">
            <Boxes size={20} />
          </span>
          <div className="flex flex-col min-w-0">
            <h2 id="asset-dialog-title" className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--po-ink)]">
              Create asset
            </h2>
            <span className="text-[13px] text-[var(--po-ink-3)]">
              {createdAsset
                ? `Created “${createdAsset.name}” — uploading files…`
                : "Adds an asset to the workspace"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--po-chip)] text-[var(--po-ink-2)] hover:bg-[var(--po-line)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <div className="p-6 flex flex-col gap-5">
            {/* Form Error Banner */}
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-3 p-3.5 rounded-[14px] bg-[color-mix(in_oklch,var(--po-danger)_9%,var(--po-card))] border border-[color-mix(in_oklch,var(--po-danger)_28%,transparent)] text-[var(--po-danger)]"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold">
                    {hasUploadFailed ? "Upload incomplete" : "Couldn’t create asset"}
                  </span>
                  <span className="text-[13px] text-[var(--po-ink-2)] leading-relaxed">{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--po-ink-3)] hover:text-[var(--po-ink)] cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Two-column layout matching prototype (1040px / 380px) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-7 items-start">
              {/* Left Column: Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {/* Asset Name */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Asset name <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mira"
                    disabled={isSubmitting || Boolean(createdAsset)}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50"
                  />
                </div>

                {/* Asset Code */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Asset code <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CH_MIRA"
                    disabled={isSubmitting || Boolean(createdAsset)}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 font-mono uppercase bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Category <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <Select
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onChange={setCategory}
                    ariaLabel="Category"
                    size="md"
                    disabled={isSubmitting || Boolean(createdAsset)}
                  />
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Priority <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <Select
                    value={priority}
                    options={PRIORITY_OPTIONS}
                    onChange={setPriority}
                    ariaLabel="Priority"
                    size="md"
                    disabled={isSubmitting || Boolean(createdAsset)}
                  />
                </div>

                {/* Destination Project */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Destination project <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <Select
                    value={projectId}
                    options={projectOptions}
                    onChange={(val) => {
                      setProjectId(val);
                      setEpisodeId("");
                    }}
                    placeholder="Select project..."
                    ariaLabel="Destination project"
                    size="md"
                    disabled={isSubmitting || Boolean(createdAsset)}
                  />
                </div>

                {/* Episode */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Episode <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <Select
                    value={episodeId}
                    options={episodeOptions}
                    onChange={setEpisodeId}
                    placeholder={isLoadingEpisodes ? "Loading episodes..." : "None — project-level"}
                    ariaLabel="Episode"
                    size="md"
                    disabled={isSubmitting || Boolean(createdAsset) || isLoadingEpisodes}
                  />
                  <span className="text-[11px] text-[var(--po-ink-3)]">
                    Leave empty to keep it project-level.
                  </span>
                </div>

                {/* Asset Workflow */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Asset workflow <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <Select
                    value={workflowId}
                    options={workflowOptions}
                    onChange={setWorkflowId}
                    ariaLabel="Asset workflow"
                    size="md"
                    disabled={isSubmitting || Boolean(createdAsset)}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Description <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes for the team"
                    disabled={isSubmitting || Boolean(createdAsset)}
                    className="p-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] resize-y min-h-[76px] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Right Column: Preview Image Dropzone + FileUploadList */}
              <div className="flex flex-col gap-5 min-w-0">
                {/* 1. Preview Image */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                      Preview image <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlField((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--po-accent)] hover:underline cursor-pointer"
                    >
                      <LinkIcon size={11} />
                      {showUrlField ? "Hide URL field" : "or paste an image URL"}
                    </button>
                  </div>

                  {showUrlField && (
                    <input
                      type="url"
                      value={previewUrl}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                      placeholder="https://example.com/image.png"
                      disabled={isSubmitting}
                      className="h-9 px-3 rounded-[10px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] bg-[var(--po-card)] text-[13px] text-[var(--po-ink)] outline-none"
                    />
                  )}

                  <ImageDropzone
                    value={previewBlobUrl || previewUrl || null}
                    fileName={previewFile?.name}
                    onFile={handlePreviewFileChosen}
                    onRemove={handlePreviewFileRemoved}
                    state={previewState}
                    progress={previewProgress}
                    error={previewError}
                    disabled={isSubmitting && !hasUploadFailed}
                  />
                </div>

                {/* 2. File Upload List */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                      Files{" "}
                      <span className="text-[12px] text-[var(--po-ink-3)] font-normal">
                        {files.length > 0
                          ? `${files.length} ${files.length === 1 ? "file" : "files"}`
                          : "Optional"}
                      </span>
                    </label>
                  </div>

                  <FileUploadList
                    files={files}
                    onAdd={handleAddFiles}
                    onRemove={handleRemoveFile}
                    onRetry={handleRetryFile}
                    disabled={isSubmitting && !hasUploadFailed}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="mt-auto flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--po-line)] bg-[var(--po-card)]">
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[var(--po-ink-3)]">
                <span className="text-[var(--po-danger)]">*</span> Required
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-full border border-[var(--po-line-2)] hover:bg-[var(--po-chip)] text-[13px] font-medium text-[var(--po-ink)] transition-colors cursor-pointer disabled:opacity-50"
              >
                {hasUploadFailed ? "Close" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 min-w-[140px] px-5 rounded-full bg-[var(--po-ink)] text-[var(--po-panel)] text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {createdAsset ? "Uploading files…" : "Creating…"}
                  </>
                ) : hasUploadFailed ? (
                  "Retry uploads"
                ) : (
                  "Create asset"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AssetFormDialog;
