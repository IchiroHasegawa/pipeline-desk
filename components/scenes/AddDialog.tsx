"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { DayV2, MainTaskV2, CustomTaskV2 } from "@/types/production-v2";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type AddDialogProps = {
  isOpen: boolean;
  days: DayV2[];
  mainTasks: MainTaskV2[];
  customTasksByDay: Record<string, CustomTaskV2[]>;
  defaultDayId?: string | null;
  onClose: () => void;
  onCreateDay: (data: { dayDate: string; title?: string; description?: string }) => Promise<void>;
  onCreateTask: (data: {
    name: string;
    dayId: string;
    contributesToTaskId?: string;
    branchesFromTaskId?: string;
    description?: string;
  }) => Promise<void>;
};

export const AddDialog: React.FC<AddDialogProps> = ({
  isOpen,
  days,
  mainTasks,
  customTasksByDay,
  defaultDayId,
  onClose,
  onCreateDay,
  onCreateTask,
}) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [createType, setCreateType] = useState<"day" | "task">("day");

  // Day Form State
  const [dayDate, setDayDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dayTitle, setDayTitle] = useState("");
  const [dayDescription, setDayDescription] = useState("");

  // Task Form State
  const [taskName, setTaskName] = useState("");
  const [selectedDayIdState, setSelectedDayIdState] = useState("");
  const [contributesToTaskId, setContributesToTaskId] = useState("");
  const [branchesFromTaskId, setBranchesFromTaskId] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const selectedDayId = selectedDayIdState || defaultDayId || (days.length > 0 ? days[0].id : "");

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

  const currentSiblingTasks = selectedDayId ? customTasksByDay[selectedDayId] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      setIsSubmitting(true);
      if (createType === "day") {
        if (!dayDate) {
          setFormError("Date is required.");
          setIsSubmitting(false);
          return;
        }
        await onCreateDay({
          dayDate,
          title: dayTitle.trim() || undefined,
          description: dayDescription.trim() || undefined,
        });
      } else {
        if (!taskName.trim() || !selectedDayId) {
          setFormError("Task name and Day selection are required.");
          setIsSubmitting(false);
          return;
        }
        await onCreateTask({
          name: taskName.trim(),
          dayId: selectedDayId,
          contributesToTaskId: contributesToTaskId || undefined,
          branchesFromTaskId: branchesFromTaskId || undefined,
          description: taskDescription.trim() || undefined,
        });
      }

      // Reset
      setDayTitle("");
      setDayDescription("");
      setTaskName("");
      setTaskDescription("");
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
        aria-labelledby="add-dialog-title"
        className="w-full max-w-md bg-[var(--color-canvas,#ffffff)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] p-6 shadow-xl text-[var(--color-ink,#000000)] font-sans"
      >
        <div className="flex flex-row items-center justify-between pb-3 border-b border-[var(--color-line-soft,#a9a9a9)]">
          <h2
            id="add-dialog-title"
            className="text-[var(--text-section,18px)] font-medium tracking-tight"
          >
            Create Item
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

        {/* Step 1: Selector Type Toggle */}
        <div className="flex flex-row border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] overflow-hidden my-4 text-[var(--text-caption,11px)]">
          <button
            type="button"
            onClick={() => setCreateType("day")}
            className={`flex-1 py-1.5 cursor-pointer font-medium transition-colors ${
              createType === "day"
                ? "bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)]"
                : "bg-transparent text-[var(--color-ink,#000000)] hover:bg-neutral-100"
            }`}
          >
            New Day (Date)
          </button>
          <button
            type="button"
            onClick={() => setCreateType("task")}
            className={`flex-1 py-1.5 cursor-pointer font-medium transition-colors ${
              createType === "task"
                ? "bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)]"
                : "bg-transparent text-[var(--color-ink,#000000)] hover:bg-neutral-100"
            }`}
          >
            New Custom Task
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[var(--text-caption,11px)] rounded-[var(--radius-sm,3px)]">
              {formError}
            </div>
          )}

          {createType === "day" ? (
            <>
              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Day Date *
                </label>
                <input
                  ref={firstInputRef}
                  type="date"
                  required
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={dayTitle}
                  onChange={(e) => setDayTitle(e.target.value)}
                  placeholder="e.g. Day 01 - Setup"
                  className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={dayDescription}
                  onChange={(e) => setDayDescription(e.target.value)}
                  placeholder="Notes for this day..."
                  className="w-full px-3 py-1.5 text-[var(--text-list,12px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Task Name *
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. Rough Layout Test"
                  className="w-full px-3 py-1.5 text-[var(--text-body,15px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Target Day *
                </label>
                <select
                  required
                  value={selectedDayId}
                  onChange={(e) => setSelectedDayIdState(e.target.value)}
                  className="w-full px-3 py-1.5 text-[var(--text-list,12px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">-- Select Day --</option>
                  {days.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.dayDate} {d.title ? `(${d.title})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Contributes to Main Task (Progress Rollup)
                </label>
                <select
                  value={contributesToTaskId}
                  onChange={(e) => setContributesToTaskId(e.target.value)}
                  className="w-full px-3 py-1.5 text-[var(--text-list,12px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">-- None (Standalone) --</option>
                  {mainTasks.map((mt) => (
                    <option key={mt.id} value={mt.id}>
                      {mt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Continues from Sibling Task (Visual Vector)
                </label>
                <select
                  value={branchesFromTaskId}
                  onChange={(e) => setBranchesFromTaskId(e.target.value)}
                  className="w-full px-3 py-1.5 text-[var(--text-list,12px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">-- Off Day Line --</option>
                  {currentSiblingTasks.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task notes..."
                  className="w-full px-3 py-1.5 text-[var(--text-list,12px)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            </>
          )}

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
              {isSubmitting ? "Creating..." : createType === "day" ? "Create Day" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddDialog;
