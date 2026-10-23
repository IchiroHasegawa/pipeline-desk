"use client";

import React from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";

export interface AuthCardProps {
  ownerHeader?: {
    step: number;
    totalSteps: number;
  };
  heroIcon?: React.ReactNode;
  title: string;
  sub?: React.ReactNode;
  identity?: {
    name: string;
    onChange?: () => void;
  };
  errorMessage?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
  secondaryLink?: React.ReactNode;
}

function getInitials(name: string): string {
  const parts = String(name || "")
    .split(/[._\-\s@]/)
    .filter(Boolean);
  const first = parts[0]?.[0] || "?";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
}

export function AuthCard({
  ownerHeader,
  heroIcon,
  title,
  sub,
  identity,
  errorMessage,
  children,
  footer,
  secondaryLink,
}: AuthCardProps) {
  return (
    <>
      <div className="bg-[var(--po-card)] border border-[var(--po-line)] rounded-[28px] shadow-[var(--po-shadow)] overflow-hidden transition-all duration-150">
        {/* Optional Owner Header Band */}
        {ownerHeader && (
          <div className="bg-[var(--po-rail)] text-white px-5 py-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-none">
              <ShieldCheck size={18} className="text-white" />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[14px] font-semibold">Owner access</span>
              <span className="text-[12px] text-white/60">
                Two-factor authentication required
              </span>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1.5 flex-none">
              <span className="text-[11px] font-medium text-white/60 tabular-nums">
                Step {ownerHeader.step} of {ownerHeader.totalSteps}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: ownerHeader.totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-5 h-1 rounded-full transition-colors ${
                      i + 1 <= ownerHeader.step ? "bg-white" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="p-7 sm:p-[30px_32px_32px] flex flex-col gap-[22px]">
          {/* Hero Icon */}
          {heroIcon && (
            <div className="w-14 h-14 rounded-full bg-[color-mix(in_oklch,var(--po-accent)_14%,var(--po-card))] text-[var(--po-accent)] flex items-center justify-center text-[24px]">
              {heroIcon}
            </div>
          )}

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[var(--po-ink)]">
              {title}
            </h1>
            {sub && (
              <p className="m-0 text-[14px] leading-relaxed text-[var(--po-ink-2)] text-pretty">
                {sub}
              </p>
            )}
          </div>

          {/* Identity Pill */}
          {identity && (
            <div className="flex items-center gap-2.5 p-1.5 rounded-full bg-[var(--po-sunken)] border border-[var(--po-line)]">
              <span className="w-[30px] h-[30px] rounded-full bg-[color-mix(in_oklch,var(--po-accent)_18%,var(--po-card))] text-[var(--po-accent)] text-[11px] font-semibold flex items-center justify-center flex-none">
                {getInitials(identity.name)}
              </span>
              <span className="flex-1 min-w-0 text-[14px] font-medium truncate text-[var(--po-ink)]">
                {identity.name}
              </span>
              {identity.onChange && (
                <button
                  type="button"
                  onClick={identity.onChange}
                  className="h-[30px] px-3 rounded-full text-[var(--po-accent)] font-semibold text-[13px] hover:bg-[color-mix(in_oklch,var(--po-accent)_10%,transparent)] transition-colors cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
          )}

          {/* Form Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex gap-3 items-start p-3 sm:p-[12px_14px] rounded-[14px] bg-[color-mix(in_oklch,var(--po-danger)_9%,var(--po-card))] border border-[color-mix(in_oklch,var(--po-danger)_28%,transparent)]"
            >
              <AlertCircle
                size={18}
                className="text-[var(--po-danger)] mt-0.5 shrink-0"
              />
              <span className="text-[13px] font-medium text-[var(--po-ink)] leading-normal">
                {errorMessage}
              </span>
            </div>
          )}

          {/* Inner form/content */}
          {children}
        </div>

        {/* Card Footer Slot */}
        {footer && (
          <div className="border-t border-[var(--po-line)] px-8 py-4 flex justify-center items-center gap-1.5 text-[13px] text-[var(--po-ink-2)] bg-[var(--po-panel)]">
            {footer}
          </div>
        )}
      </div>

      {/* Optional secondary owner link underneath card */}
      {secondaryLink && (
        <div className="flex justify-center mt-1">
          {secondaryLink}
        </div>
      )}
    </>
  );
}

export default AuthCard;
