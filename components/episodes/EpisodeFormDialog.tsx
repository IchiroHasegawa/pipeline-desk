"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type EpisodeFormDialogProps = {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSubmit: (data: {
    projectId: string;
    episodeName: string;
    code?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
};

export const EpisodeFormDialog: React.FC<EpisodeFormDialogProps> = ({
  isOpen,
  projectId,
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

    if (!episodeName.trim() || !startDate) {
      setFormError("Please fill out all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        projectId,
        episodeName: episodeName.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
      });

      // Reset form
      setEpisodeName("");
      setCode("");
      setDescription("");
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
        aria-labelledby="episode-dialog-title"
        className="w-full max-w-md bg-[var(--color-canvas,#ffffff)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] p-6 shadow-xl text-[var(--color-ink,#000000)] font-sans"
      >
        <div className="flex flex-row items-center justify-between pb-4 border-b border-[var(--color-line-soft,#a9a9a9)]">
          <h2
            id="episode-dialog-title"
            className="text-[var(--text-section,18px)] font-medium tracking-tight"
          >
            Create New Episode
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
            <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
              Episode Name *
            </label>
            <input
              ref={firstInputRef}
              type="text"
              required
              value={episodeName}
              onChange={(e) => setEpisodeName(e.target.value)}
              placeholder="e.g. Episode 01"
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
              Episode Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. EP01"
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black font-mono uppercase"
            />
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
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black font-mono"
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
              className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black font-mono"
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
              placeholder="Brief episode description..."
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
              disabled={isSubmitting}
              className="px-4 py-1.5 text-[var(--text-caption,11px)] bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] rounded-[var(--radius-sm,3px)] hover:bg-neutral-800 cursor-pointer font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Episode"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EpisodeFormDialog;
