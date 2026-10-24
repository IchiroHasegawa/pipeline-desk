"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Clapperboard, X, AlertCircle, Loader2 } from "lucide-react";
import { getJobWorkflows, getSceneWorkflows } from "@/app/actions/production";
import { Select, type SelectOption } from "@/components/app-shell/Select";
import { ImageDropzone } from "@/components/app-shell/ImageDropzone";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type EpisodeFormDialogProps = {
  isOpen: boolean;
  projectId: string;
  projectTitle?: string;
  onClose: () => void;
  onSubmit: (data: {
    projectId: string;
    episodeName: string;
    code?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    jobWorkflowId?: string;
    sceneWorkflowId?: string;
  }) => Promise<void>;
};

type WorkflowOption = { id: string; name: string };

export const EpisodeFormDialog: React.FC<EpisodeFormDialogProps> = ({
  isOpen,
  projectId,
  projectTitle,
  onClose,
  onSubmit,
}) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [episodeName, setEpisodeName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  const [jobWorkflowId, setJobWorkflowId] = useState("");
  const [sceneWorkflowId, setSceneWorkflowId] = useState("");

  const [jobWorkflows, setJobWorkflows] = useState<WorkflowOption[]>([]);
  const [sceneWorkflows, setSceneWorkflows] = useState<WorkflowOption[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Load both workflow lists when the dialog opens.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    async function loadWorkflows() {
      try {
        setIsLoadingWorkflows(true);
        const [jobs, scenes] = await Promise.all([
          getJobWorkflows(),
          getSceneWorkflows(),
        ]);
        if (!cancelled) {
          setJobWorkflows(jobs);
          setSceneWorkflows(scenes);
          // The episode workflow is optional, so it stays blank ("None") until chosen.
          // The scene workflow is required, so it auto-selects first if available.
          if (scenes.length > 0) {
            setSceneWorkflowId((prev) => prev || scenes[0].id);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setFormError(`Failed to load workflows: ${msg}`);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWorkflows(false);
        }
      }
    }

    loadWorkflows();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

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

    if (!episodeName.trim() || !startDate) {
      setFormError("Please fill out all required fields.");
      return;
    }

    if (!sceneWorkflowId) {
      setFormError("A scene workflow selection is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        projectId,
        episodeName: episodeName.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        jobWorkflowId: jobWorkflowId || undefined,
        sceneWorkflowId: sceneWorkflowId || undefined,
      });

      // Reset form
      setEpisodeName("");
      setCode("");
      setDescription("");
      setJobWorkflowId("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const jobOptions: SelectOption[] = [
    { value: "", label: "None — no episode tasks" },
    ...jobWorkflows.map((w) => ({ value: w.id, label: w.name })),
  ];

  const sceneOptions: SelectOption[] = sceneWorkflows.map((w) => ({
    value: w.id,
    label: w.name,
  }));

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="episode-dialog-title"
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
            <Clapperboard size={20} />
          </span>
          <div className="flex flex-col min-w-0">
            <h2 id="episode-dialog-title" className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--po-ink)]">
              Create episode
            </h2>
            <span className="text-[13px] text-[var(--po-ink-3)]">
              {projectTitle ? `In ${projectTitle}` : "Adds an episode to this project"}
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
                  <span className="text-[13px] font-semibold">Couldn’t create episode</span>
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
              {/* Left Column: Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {/* Episode Name */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Episode name <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    required
                    value={episodeName}
                    onChange={(e) => setEpisodeName(e.target.value)}
                    placeholder="e.g. EP_113"
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50"
                  />
                </div>

                {/* Episode Code */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Episode code <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LNF_E113"
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 font-mono uppercase bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50"
                  />
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

                {/* Job Workflow */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Job workflow <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <Select
                    value={jobWorkflowId}
                    options={jobOptions}
                    onChange={setJobWorkflowId}
                    placeholder="None — no episode tasks"
                    ariaLabel="Job workflow"
                    size="md"
                    disabled={isSubmitting || isLoadingWorkflows}
                  />
                </div>

                {/* Scene Workflow */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Scene workflow <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <Select
                    value={sceneWorkflowId}
                    options={sceneOptions}
                    onChange={setSceneWorkflowId}
                    placeholder={isLoadingWorkflows ? "Loading workflows..." : "Select workflow..."}
                    ariaLabel="Scene workflow"
                    size="md"
                    disabled={isSubmitting || isLoadingWorkflows}
                  />
                  <span className="text-[11px] text-[var(--po-ink-3)]">
                    Applies to every scene in this episode.
                  </span>
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
                    placeholder="Synopsis or production notes"
                    disabled={isSubmitting}
                    className="p-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] resize-y min-h-[84px] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Right Column: Preview Image Dropzone (Disabled placeholder) */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                  Preview image <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                </label>
                <ImageDropzone
                  disabled={true}
                  disabledNote="Image upload will be available after the storage update."
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
                  "Create episode"
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

export default EpisodeFormDialog;
