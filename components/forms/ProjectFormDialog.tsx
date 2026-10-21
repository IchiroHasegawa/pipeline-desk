"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

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
    setCodeError(null);

    // Validate project code format
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-md bg-[var(--color-canvas,#ffffff)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] p-6 shadow-xl text-[var(--color-ink,#000000)] font-sans"
      >
        <div className="flex flex-row items-center justify-between pb-4 border-b border-[var(--color-line-soft,#a9a9a9)]">
          <h2
            id="dialog-title"
            className="text-[var(--text-section,18px)] font-medium tracking-tight"
          >
            Create New Project
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] hover:text-[var(--color-ink)] cursor-pointer font-mono"
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
            <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
              Project Title *
            </label>
            <input
              ref={firstInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Alpha"
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
            />
          </div>

          <div>
            <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
              Project Code *
            </label>
            <input
              type="text"
              required
              value={projectCode}
              onChange={(e) => {
                setProjectCode(e.target.value);
                setCodeError(null);
              }}
              placeholder="e.g. PROJ_ALPHA"
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-[var(--color-ink)] font-mono uppercase"
            />
            {codeError && (
              <p className="mt-1 text-[var(--text-caption,11px)] text-red-600">
                {codeError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-[var(--color-ink)] font-mono"
            />
          </div>

          <div>
            <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-[var(--color-ink)] font-mono"
            />
          </div>

          <div>
            <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project description..."
              className="w-full px-3 py-1.5 text-[var(--text-list,12px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-[var(--color-ink)] resize-none"
            />
          </div>

          <div className="flex flex-row items-center justify-end gap-3 pt-3 border-t border-[var(--color-line-soft,#a9a9a9)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-[var(--text-caption,11px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] hover:bg-[var(--color-panel)] cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-[var(--text-caption,11px)] bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] rounded-[var(--radius-sm,3px)] hover:opacity-90 cursor-pointer font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProjectFormDialog;
