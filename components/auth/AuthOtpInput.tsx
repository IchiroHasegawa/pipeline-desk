"use client";

import React, { useRef, useEffect, useState } from "react";

export interface AuthOtpInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
}

export function AuthOtpInput({
  id = "otp-code",
  name = "code",
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  error = false,
}: AuthOtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const digits = [0, 1, 2, 3, 4, 5];

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-6 gap-2 w-full">
        {digits.map((i) => {
          const ch = value[i] || "";
          const isCurrent = isFocused && !error && i === Math.min(value.length, 5);

          return (
            <div
              key={i}
              className={`h-[58px] rounded-[14px] border bg-[var(--po-card)] flex items-center justify-center text-[24px] font-semibold font-mono tabular-nums transition-all ${
                error
                  ? "border-[var(--po-danger)] ring-4 ring-[color-mix(in_oklch,var(--po-danger)_14%,transparent)] text-[var(--po-danger)]"
                  : isCurrent
                  ? "border-[var(--po-accent)] ring-4 ring-[color-mix(in_oklch,var(--po-accent)_18%,transparent)] text-[var(--po-ink)]"
                  : ch
                  ? "border-[var(--po-ink-3)] text-[var(--po-ink)]"
                  : "border-[var(--po-line-2)] text-[var(--po-ink)]"
              }`}
            >
              {ch}
              {isFocused && !error && i === value.length && (
                <span className="w-[1.5px] h-[26px] bg-[var(--po-accent)] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        aria-label="6-digit authentication code"
        className="absolute inset-0 w-full h-full opacity-0 border-0 text-[16px] cursor-text"
      />
    </div>
  );
}

export default AuthOtpInput;
