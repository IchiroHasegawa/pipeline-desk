"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { createSceneV2, getSceneWorkflows } from "@/app/actions/production";
import type { SceneV2 } from "@/types/production-v2";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type SceneFormDialogProps = {
  isOpen: boolean;
  episodeId: string;
  onClose: () => void;
  onSuccess: (newScene: SceneV2) => void;
};

export const SceneFormDialog: React.FC<SceneFormDialogProps> = ({
  isOpen,
  episodeId,
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
          if (data.length > 0) {
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
  }, [isOpen]);

  // Focus trap & Escape listener
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
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
  }, [isOpen, onClose]);

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
        priority: priority ? parseInt(priority, 10) : undefined,
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

  const isSubmitDisabled =
    isSubmitting ||
    isLoadingWorkflows ||
    workflows.length === 0 ||
    !sceneName.trim() ||
    !workflowId;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-dialog-title"
        className="w-full max-w-md bg-[var(--color-canvas,#ffffff)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] p-6 shadow-xl text-[var(--color-ink,#000000)] font-sans"
      >
        <div className="flex flex-row items-center justify-between pb-4 border-b border-[var(--color-line-soft,#a9a9a9)]">
          <h2
            id="scene-dialog-title"
            className="text-[var(--text-section,18px)] font-medium tracking-tight"
          >
            Create New Scene
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] hover:text-black cursor-pointer font-mono"
          >
            [ESC]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[var(--text-caption,11px)] rounded-[var(--radius-sm,3px)]">
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="scene-name-input"
              className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1"
            >
              Scene Name <span className="text-red-500">*</span>
            </label>
            <input
              id="scene-name-input"
              ref={firstInputRef}
              type="text"
              required
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="e.g. Scene 01"
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label
              htmlFor="scene-workflow-select"
              className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1"
            >
              Workflow <span className="text-red-500">*</span>
            </label>
            {isLoadingWorkflows ? (
              <div className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-mono py-1.5">
                Loading scene workflows...
              </div>
            ) : workflows.length === 0 ? (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-[var(--text-caption,11px)] rounded-[var(--radius-sm,3px)]">
                A scene workflow must be created in Settings first before creating a scene.
              </div>
            ) : (
              <select
                id="scene-workflow-select"
                required
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
              >
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="scene-frames-input"
                className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1"
              >
                Number of Frames (Optional)
              </label>
              <input
                id="scene-frames-input"
                type="number"
                min="0"
                value={numberOfFrames}
                onChange={(e) => setNumberOfFrames(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="scene-priority-input"
                className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1"
              >
                Priority (Optional)
              </label>
              <input
                id="scene-priority-input"
                type="number"
                min="1"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="scene-description-textarea"
              className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="scene-description-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief scene description..."
              className="w-full px-3 py-1.5 text-[var(--text-list,12px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black resize-none"
            />
          </div>

          <div className="flex flex-row items-center justify-end gap-3 pt-3 border-t border-[var(--color-line-soft,#a9a9a9)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-[var(--text-caption,11px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] hover:bg-neutral-100 cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-4 py-1.5 text-[var(--text-caption,11px)] bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] rounded-[var(--radius-sm,3px)] hover:bg-neutral-800 cursor-pointer font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Scene"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default SceneFormDialog;
