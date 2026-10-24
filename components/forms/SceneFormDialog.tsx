"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Film, X, AlertCircle, Loader2 } from "lucide-react";
import { createSceneV2, getSceneWorkflows } from "@/app/actions/production";
import { Select, type SelectOption } from "@/components/app-shell/Select";
import { ImageDropzone } from "@/components/app-shell/ImageDropzone";
import type { SceneV2 } from "@/types/production-v2";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const PRIORITY_LABELS: Record<string, string> = {
  "1": "Lowest",
  "2": "Low",
  "3": "Normal",
  "4": "High",
  "5": "Highest",
};

export type SceneFormDialogProps = {
  isOpen: boolean;
  episodeId: string;
  episodeName?: string;
  defaultSceneWorkflowId?: string | null;
  onClose: () => void;
  onSuccess: (newScene: SceneV2) => void;
};

export const SceneFormDialog: React.FC<SceneFormDialogProps> = ({
  isOpen,
  episodeId,
  episodeName,
  defaultSceneWorkflowId = null,
  onClose,
  onSuccess,
}) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [sceneName, setSceneName] = useState("");
  const [description, setDescription] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [numberOfFrames, setNumberOfFrames] = useState<string>("");
  const [priority, setPriority] = useState<string>("1");

  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Load active scene workflows when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    async function loadWorkflows() {
      try {
        setIsLoadingWorkflows(true);
        const data = await getSceneWorkflows();
        if (!cancelled) {
          setWorkflows(data);
          const inherited =
            defaultSceneWorkflowId &&
            data.some((wf) => wf.id === defaultSceneWorkflowId)
              ? defaultSceneWorkflowId
              : null;

          if (inherited) {
            setWorkflowId(inherited);
          } else if (data.length > 0) {
            setWorkflowId(data[0].id);
          } else {
            setWorkflowId("");
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
  }, [isOpen, defaultSceneWorkflowId]);

  // Focus trap & Escape listener
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

    if (!sceneName.trim()) {
      setFormError("Scene name is required.");
      return;
    }

    if (!workflowId) {
      setFormError("A scene workflow selection is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const newScene = await createSceneV2({
        episodeId,
        sceneName: sceneName.trim(),
        description: description.trim() || undefined,
        workflowId,
        numberOfFrames: numberOfFrames ? parseInt(numberOfFrames, 10) : undefined,
        priority: parseInt(priority, 10),
      });

      // Reset form
      setSceneName("");
      setDescription("");
      setNumberOfFrames("");
      setPriority("1");

      onSuccess(newScene);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const workflowOptions: SelectOption[] = workflows.map((w) => ({
    value: w.id,
    label: w.name,
  }));

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scene-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="w-[900px] max-w-full max-h-[calc(100vh-48px)] flex flex-col rounded-[26px] border border-[var(--po-line)] bg-[var(--po-card)] text-[var(--po-ink)] shadow-[var(--po-shadow-lg)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 px-6 pt-5 pb-4 border-b border-[var(--po-line)]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--po-chip)] text-[var(--po-ink-2)]">
            <Film size={20} />
          </span>
          <div className="flex flex-col min-w-0">
            <h2 id="scene-dialog-title" className="text-[18px] font-semibold tracking-[-0.015em] text-[var(--po-ink)]">
              Create scene
            </h2>
            <span className="text-[13px] text-[var(--po-ink-3)]">
              {episodeName ? `In ${episodeName}` : "Adds a scene to this episode"}
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
                  <span className="text-[13px] font-semibold">Couldn’t create scene</span>
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
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-7 items-start">
              {/* Left Column: Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {/* Scene Name */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Scene name <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    required
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    placeholder="e.g. 104_017"
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50"
                  />
                </div>

                {/* Frames */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Number of frames <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={numberOfFrames}
                    onChange={(e) => setNumberOfFrames(e.target.value)}
                    placeholder="e.g. 120"
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-[12px] border border-[var(--po-line-2)] focus:border-[var(--po-accent)] focus:ring-2 focus:ring-[var(--po-accent)]/20 bg-[var(--po-card)] text-[var(--po-ink)] text-[14px] outline-none transition-all placeholder:text-[var(--po-ink-3)] disabled:opacity-50"
                  />
                </div>

                {/* Priority (Segmented 1-5 control matching prototype) */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Priority <span className="text-[12px] text-[var(--po-ink-3)] font-normal">Optional</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1 p-1 rounded-[12px] bg-[var(--po-chip)]">
                      {["1", "2", "3", "4", "5"].map((n) => {
                        const isSelected = priority === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPriority(n)}
                            disabled={isSubmitting}
                            className={`h-[32px] w-[34px] rounded-[9px] border-none text-[13px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[var(--po-card)] text-[var(--po-ink)] shadow-xs"
                                : "bg-transparent text-[var(--po-ink-2)] hover:text-[var(--po-ink)]"
                            }`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[12px] text-[var(--po-ink-3)]">
                      {PRIORITY_LABELS[priority]}
                    </span>
                  </div>
                </div>

                {/* Scene Workflow */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="flex items-center gap-1 text-[13px] font-medium text-[var(--po-ink)]">
                    Scene workflow <span className="text-[var(--po-danger)]">*</span>
                  </label>
                  <Select
                    value={workflowId}
                    options={workflowOptions}
                    onChange={setWorkflowId}
                    placeholder={isLoadingWorkflows ? "Loading workflows..." : "Select workflow..."}
                    ariaLabel="Scene workflow"
                    size="md"
                    disabled={isSubmitting || isLoadingWorkflows}
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
                    placeholder="Action, camera and timing notes"
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
                  "Create scene"
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

export default SceneFormDialog;
