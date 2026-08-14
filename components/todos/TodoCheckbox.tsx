"use client";

import React, { useState, memo } from "react";

export type TodoCheckboxProps = {
  id: string;
  checked: boolean;
  label: string;
  disabled?: boolean;
  /**
   * Render the 12 × 12 box alone, keeping `label` as the accessible name only.
   * DESIGN_SPEC §8 positions the To Do checkbox and its text label at separate
   * measured coordinates, so they cannot be laid out as one inline pair.
   */
  hideLabel?: boolean;
  onToggle: (id: string, next: boolean) => void;
};

export const TodoCheckboxComponent: React.FC<TodoCheckboxProps> = ({
  id,
  checked,
  label,
  disabled = false,
  hideLabel = false,
  onToggle,
}) => {
  const [prevCheckedProp, setPrevCheckedProp] = useState(checked);
  const [internalChecked, setInternalChecked] = useState(checked);

  if (checked !== prevCheckedProp) {
    setPrevCheckedProp(checked);
    setInternalChecked(checked);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.checked;
    setInternalChecked(nextVal);
    onToggle(id, nextVal);
  };

  return (
    <label
      htmlFor={`todo-checkbox-${id}`}
      className={`inline-flex items-center cursor-pointer select-none font-sans text-[var(--text-list,12px)] ${
        hideLabel ? "" : "gap-2"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        id={`todo-checkbox-${id}`}
        type="checkbox"
        checked={internalChecked}
        disabled={disabled}
        onChange={handleChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="w-[12px] h-[12px] shrink-0 border border-[var(--color-line,#000000)] rounded-[var(--radius-xs,1px)] bg-transparent peer-checked:bg-[var(--color-progress,#000000)] peer-focus-visible:ring-1 peer-focus-visible:ring-black motion-safe:transition-all motion-safe:duration-150 flex items-center justify-center"
      >
        {internalChecked && (
          <svg
            className="w-[8px] h-[8px] text-[var(--color-canvas,#ffffff)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {!hideLabel && (
        <span
          className={`truncate ${
            internalChecked
              ? "line-through text-[var(--color-ink-muted,#707070)]"
              : "text-[var(--color-ink,#000000)]"
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
};

export const TodoCheckbox = memo(TodoCheckboxComponent);
export default TodoCheckbox;
