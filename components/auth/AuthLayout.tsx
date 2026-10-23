"use client";

import React from "react";
import { Clapperboard, FlaskConical, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export interface AuthLayoutProps {
  children: React.ReactNode;
  isStaging?: boolean;
}

export function AuthLayout({ children, isStaging = false }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--po-bg)] text-[var(--po-ink)] font-sans flex items-center justify-center p-6 relative transition-colors duration-150">
      {/* Top-right floating theme toggle button */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        className="absolute top-7 right-7 w-12 h-12 rounded-full border border-[var(--po-line)] bg-[var(--po-card)] text-[var(--po-ink-2)] hover:text-[var(--po-ink)] shadow-[var(--po-shadow)] flex items-center justify-center p-0 cursor-pointer transition-colors"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Main Centered Auth Column */}
      <div className="w-[420px] max-w-full flex flex-col gap-5 text-[var(--po-ink)]">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-[var(--po-rail)] text-white flex items-center justify-center text-[17px] shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
            <Clapperboard size={18} />
          </span>
          <span className="text-[16px] font-semibold tracking-tight text-[var(--po-ink)]">
            Production OS
          </span>
          {isStaging && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[var(--po-ink-2)] border border-dashed border-[var(--po-line-2)] px-2 py-0.5 rounded-full">
              <FlaskConical size={12} />
              Staging
            </span>
          )}
        </div>

        {/* Card Content & Under-card secondary links */}
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
