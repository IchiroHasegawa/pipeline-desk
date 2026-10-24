"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FolderKanban, X, AlertCircle, Loader2, Link as LinkIcon } from "lucide-react";
import { ImageDropzone } from "@/components/app-shell/ImageDropzone";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type ProjectFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    projectCode: string;
    description?: string;
    startDate: string;
    endDate?: string;
    thumbnailUrl?: string;
  }) => Promise<void>;
};

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [title, setTitle] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);

  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isSubmitting) {
          onClose();
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
  }, [isOpen, isSubmitting, onClose]);

  if (!isClient || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCodeError(null);

    // Validate project code format: alphanumeric with single internal underscores
    const codeRegex = /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/;
    if (!codeRegex.test(projectCode.trim())) {
      setCodeError("Code must be alphanumeric with single internal underscores (e.g. PROJ_01).");
      return;
    }

    if (!title.trim() || !startDate) {
      setFormError("Please fill out all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        projectCode: projectCode.trim().toUpperCase(),
        description: description.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      });

      // Reset form
      setTitle("");
      setProjectCode("");
      setDescription("");
      setThumbnailUrl("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="w-[980px] max-w-full max-h-[calc(100vh-48px)] flex flex-col rounded-[26px] border border-[var(--po-line)] bg-[var(--po-card)] text-[var(--po-ink)] shadow-[var(--po-shadow-lg)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 px-6 pt-5 pb-4 border-b border-[var(--po-line)]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--po-chip)] text-[var(--po-ink-2)]">
            <FolderKanban size={20} />
          </span>
          <div className="flex flex-col min-w-0">
            <h2 id="project-dialog-title" className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--po-ink)]">
              Create project
            </h2>
            <span className="text-[13px] text-[var(--po-ink-3)]">
              Adds a new project to the workspace
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                  <span className="text-[13px] font-semibold">Couldn’t create project</span>
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

            {/* Two-column layout matching prototype */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] gap-7 items-start">
              {/* Left Column: Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {/* Project Title */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Project title <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lanternfall"
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50"
                  />
                </div>

                {/* Project Code */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Project code <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={projectCode}
                    onChange={(e) => {
                      setProjectCode(e.target.value.toUpperCase());
                      setCodeError(null);
                    }}
                    placeholder="e.g. LNF"
                    disabled={isSubmitting}
                    className={`h-10 px-3 rounded-[12px] border font-mono uppercase bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50 ${
                      codeError
                        ? "border-[var(--po-danger)] focus:border-[var(--po-danger)] focus:ring-2 focus:ring-[var(--po-danger)]/20"
                        : "border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20"
                    }`}
                  />
                  {codeError ? (
                    <span className="flex items-center gap-1 text-[12px] text-[var(--po-danger)]">
                      <AlertCircle size={12} /> {codeError}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--po-ink-3)]">
                      2–6 capital letters. Used in file names.
                    </span>
                  )}
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Start date <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all disabled:opacity-50"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    End date <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all disabled:opacity-50"
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
                    placeholder="What is this project about?"
                    disabled={isSubmitting}
                    className="p-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] resize-y min-h-[84px] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Right Column: Preview Image Dropzone */}
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
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    disabled={isSubmitting}
                    className="h-9 px-3 rounded-[10px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] bg-[var(--po-card)] text-[13px] text-[var(--po-ink)] outline-none"
                  />
                )}

                <ImageDropzone
                  value={thumbnailUrl || null}
                  disabled={true}
                  disabledNote="Image upload will be available after the storage update."
                  onRemove={() => setThumbnailUrl("")}
                />
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="mt-auto flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--po-line)] bg-[var(--po-card)]">
            <span className="text-[12px] text-[var(--po-ink-3)]">
              <span className="text-[var(--po-danger)]">*</span> Required
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-full border border-[var(--po-line-2)] hover:bg-[var(--po-chip)] text-[13px] font-medium text-[var(--po-ink)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 min-w-[140px] px-5 rounded-full bg-[var(--po-ink)] text-[var(--po-panel)] text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create project"
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

export default ProjectFormDialog;
