"use client";

import React, { useState } from "react";
import { ListTodo, Plus, X } from "lucide-react";
import type { TodoV2 } from "@/types/production-v2";

export interface TodoRailProps {
  todos: TodoV2[];
  onAddTodo: (title: string) => Promise<void>;
  onCompleteTodo: (todoId: string) => Promise<void>;
  actionError?: string | null;
  onClearError?: () => void;
}

export const TodoRail: React.FC<TodoRailProps> = ({
  todos,
  onAddTodo,
  onCompleteTodo,
  actionError,
  onClearError,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyTodoIds, setBusyTodoIds] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTodo(trimmed);
      setNewTitle("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxClick = async (todoId: string) => {
    if (busyTodoIds.has(todoId)) return;
    setBusyTodoIds((prev) => new Set(prev).add(todoId));
    try {
      await onCompleteTodo(todoId);
    } finally {
      setBusyTodoIds((prev) => {
        const next = new Set(prev);
        next.delete(todoId);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full rounded-[20px] bg-[var(--po-card)] border border-[var(--po-line)] overflow-hidden shadow-[var(--po-shadow-sm)]">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-3 flex-none">
        <ListTodo size={16} className="text-[var(--po-ink-3)]" />
        <h2 className="text-[14px] font-semibold text-[var(--po-ink)] m-0">Your To Dos</h2>
        <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-2)]">
          {todos.length}
        </span>
      </div>

      {/* Add To Do Inline Input */}
      <div className="px-3 pb-2.5 flex-none">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add a To Do... (Enter to save)"
            className="h-8 w-full rounded-[10px] border border-[var(--po-line)] bg-[var(--po-sunken)] pl-3 pr-8 text-[12px] text-[var(--po-ink)] placeholder-[var(--po-ink-3)] outline-none transition-colors focus:border-[var(--po-accent)] focus:bg-[var(--po-card)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || isSubmitting}
            aria-label="Add To Do"
            className="absolute right-1.5 flex h-5 w-5 items-center justify-center rounded-[6px] text-[var(--po-ink-3)] hover:text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <Plus size={13} />
          </button>
        </form>
      </div>

      {/* Dismissible Error Notice */}
      {actionError && (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-[8px] border border-[#E5534B]/30 bg-[#E5534B]/10 px-2.5 py-1.5 text-[11px] text-[#E5534B]">
          <span className="truncate">{actionError}</span>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              aria-label="Dismiss error"
              className="text-[#E5534B] opacity-80 hover:opacity-100 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* To Do List */}
      <div className="flex-1 overflow-auto px-2 pb-2 flex flex-col gap-0.5">
        {todos.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[var(--po-ink-3)]">
            Nothing open. Add a to do above.
          </div>
        ) : (
          todos.map((todo) => {
            const isBusy = busyTodoIds.has(todo.id);
            return (
              <div
                key={todo.id}
                className={`group flex items-start gap-2.5 rounded-[10px] p-2 transition-colors hover:bg-[var(--po-chip)] ${
                  isBusy ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleCheckboxClick(todo.id)}
                  disabled={isBusy}
                  aria-label={`Complete ${todo.title}`}
                  className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-[4px] border border-[var(--po-line-2)] bg-transparent transition-colors hover:border-[var(--po-accent)] hover:bg-[var(--po-accent)]/10 cursor-pointer"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] leading-[1.4] text-[var(--po-ink)] break-words">
                    {todo.title}
                  </span>
                  {todo.description && (
                    <span className="text-[11px] leading-[1.3] text-[var(--po-ink-3)] break-words">
                      {todo.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
