"use client";

import React, { useState, memo } from "react";
import type { TodoV2 } from "@/types/production-v2";
import TodoCheckbox from "@/components/todos/TodoCheckbox";

export type TodoRailProps = {
  todos: TodoV2[];
  onToggleComplete: (id: string, complete: boolean) => void;
  onCreateTodo?: (title: string) => Promise<void>;
};

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

  return (
    <div className="relative pl-6 py-2 min-h-[160px] font-sans">
      {/* Hairline vertical rail */}
      <div className="absolute left-[7px] top-2 bottom-2 w-[0.5px] bg-[var(--color-line,#000000)] pointer-events-none" />

      {/* Quick Add Input */}
      {onCreateTodo && (
        <form onSubmit={handleAddSubmit} className="mb-4 flex flex-row items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="+ Add a new To Do..."
            disabled={isAdding}
            className="flex-1 px-3 py-1 text-[var(--text-list,12px)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] bg-transparent outline-none focus:border-black font-sans"
          />
          <button
            type="submit"
            disabled={isAdding || !newTitle.trim()}
            className="px-3 py-1 text-[11px] bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] rounded-[var(--radius-sm,3px)] font-medium cursor-pointer disabled:opacity-40"
          >
            Add
          </button>
        </form>
      )}

      {/* To Do Items list */}
      {todos.length === 0 ? (
        <div className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] py-4 italic">
          No open To Dos. All caught up!
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {todos.map((todo, idx) => {
            const isLatest = idx === 0;
            const label = isLatest ? "Latest To do" : "Next To do";

            return (
              <div key={todo.id} className="relative flex flex-col gap-1.5">
                {/* Dot */}
                <div className="absolute -left-[20px] top-[8px] w-[6px] h-[6px] rounded-full bg-[var(--color-ink,#000000)]" />

                <div className="flex flex-row items-center justify-between gap-4">
                  <span className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink-muted,#707070)] shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 h-[1px] bg-[var(--color-line-soft,#a9a9a9)]" />
                </div>

                <div className="pl-1 pt-0.5">
                  <TodoCheckbox
                    id={todo.id}
                    checked={false}
                    label={todo.title}
                    onToggle={(id, next) => onToggleComplete(id, next)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TodoRail = memo(TodoRailComponent);
export default TodoRail;
