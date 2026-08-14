"use client";

import React, { useState, memo } from "react";
import type { TodoV2 } from "@/types/production-v2";
import TodoCheckbox from "@/components/todos/TodoCheckbox";

export type TodoRailProps = {
  todos: TodoV2[];
  onToggleComplete: (id: string, complete: boolean) => void;
  onCreateTodo?: (title: string) => Promise<void>;
};

/**
 * To Do rail — DESIGN_SPEC §8.
 * Rail (789, 686) 0.5 × 409.
 * Latest — dot (786, 679) 6 × 8, label (796, 673) 196 × 56, rule (879, 683) 596,
 *          checkbox (879.5, 676) 12 × 12.
 * Next   — dot (786, 864) 6 × 7, label (796, 857) 179 × 50, rule (885, 868) 596,
 *          checkbox (864.5, 860) 12 × 12.
 *
 * The design provides exactly two slots. The quick-add form below the rail is an
 * addition — DESIGN_SPEC §14 lists empty states and overflow past the measured
 * item counts as unspecified.
 */
export const TodoRailComponent: React.FC<TodoRailProps> = ({
  todos,
  onToggleComplete,
  onCreateTodo,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !onCreateTodo) return;
    try {
      setIsAdding(true);
      await onCreateTodo(newTitle.trim());
      setNewTitle("");
    } catch (err: unknown) {
      console.error("Failed to add To Do:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const latest = todos.length > 0 ? todos[0] : null;
  const next = todos.length > 1 ? todos[1] : null;

  return (
    <>
      {/* Rail (789, 686) 0.5 × 409 */}
      <div className="absolute left-[789px] top-[686px] w-[0.5px] h-[409px] bg-[var(--color-line,#000000)] pointer-events-none" />

      {/* ---- Latest To do ---- */}
      <div className="absolute left-[786px] top-[679px] w-[6px] h-[8px] rounded-full bg-[var(--color-ink,#000000)]" />
      <div className="absolute left-[879px] top-[683px] w-[596px] h-[1px] bg-[var(--color-line-soft,#a9a9a9)]" />
      <div className="absolute left-[796px] top-[673px] w-[196px] h-[56px] font-sans">
        <span className="block text-[var(--text-list,12px)] leading-none font-medium text-[var(--color-ink-muted,#707070)]">
          Latest To do
        </span>
        <span className="block pt-[8px] text-[var(--text-caption,11px)] leading-tight text-[var(--color-ink,#000000)] line-clamp-2">
          {latest ? latest.title : "No open To Dos."}
        </span>
      </div>
      {latest && (
        <div className="absolute left-[879.5px] top-[676px]">
          <TodoCheckbox
            id={latest.id}
            checked={false}
            label={latest.title}
            hideLabel
            onToggle={(id, nextVal) => onToggleComplete(id, nextVal)}
          />
        </div>
      )}

      {/* ---- Next To do ---- */}
      <div className="absolute left-[786px] top-[864px] w-[6px] h-[7px] rounded-full bg-[var(--color-ink,#000000)]" />
      <div className="absolute left-[885px] top-[868px] w-[596px] h-[1px] bg-[var(--color-line-soft,#a9a9a9)]" />
      <div className="absolute left-[796px] top-[857px] w-[179px] h-[50px] font-sans">
        <span className="block text-[var(--text-list,12px)] leading-none font-medium text-[var(--color-ink-muted,#707070)]">
          Next To do
        </span>
        <span className="block pt-[8px] text-[var(--text-caption,11px)] leading-tight text-[var(--color-ink,#000000)] line-clamp-2">
          {next ? next.title : "Nothing queued."}
        </span>
      </div>
      {next && (
        <div className="absolute left-[864.5px] top-[860px]">
          <TodoCheckbox
            id={next.id}
            checked={false}
            label={next.title}
            hideLabel
            onToggle={(id, nextVal) => onToggleComplete(id, nextVal)}
          />
        </div>
      )}

      {/* Quick add — below the rail (686 + 409 = 1095) */}
      {onCreateTodo && (
        <form
          onSubmit={handleAddSubmit}
          className="absolute left-[796px] top-[1110px] w-[596px] flex flex-row items-center gap-2 font-sans"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="+ Add a new To Do…"
            disabled={isAdding}
            className="flex-1 px-3 py-1 text-[var(--text-list,12px)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black font-sans"
          />
          <button
            type="submit"
            disabled={isAdding || !newTitle.trim()}
            className="px-3 py-1 text-[var(--text-caption,11px)] bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] rounded-[var(--radius-sm,3px)] font-medium cursor-pointer disabled:opacity-40"
          >
            Add
          </button>
        </form>
      )}
    </>
  );
};

export const TodoRail = memo(TodoRailComponent);
export default TodoRail;
