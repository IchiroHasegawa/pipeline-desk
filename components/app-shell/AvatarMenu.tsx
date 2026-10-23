"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Crown, User, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { logoutAction } from "@/app/actions/auth";
import { useCurrentProfile } from "./useCurrentProfile";

export interface AvatarMenuProps {
  className?: string;
}

export const AvatarMenu: React.FC<AvatarMenuProps> = ({ className = "" }) => {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close when pathname changes without an effect
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  const { theme, toggleTheme } = useTheme();
  const { displayName, initials, isOwner } = useCurrentProfile();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsHovered(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const dark = theme === "dark";

  return (
    <>
      {/* Outside click backdrop */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            setIsHovered(false);
          }}
          className="fixed inset-0 z-[70]"
          aria-hidden="true"
        />
      )}

      {/* Fixed top-right container */}
      <div
        className={`fixed top-[28px] right-[28px] z-[80] flex flex-col items-end gap-2 ${className}`.trim()}
      >
        {/* Avatar Circle */}
        <div
          className="relative"
          onMouseEnter={() => !isOpen && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setIsHovered(false);
            }}
            onFocus={() => !isOpen && setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            aria-label="Account menu"
            aria-expanded={isOpen}
            className={`relative flex h-[48px] w-[48px] items-center justify-center rounded-[24px] border-2 border-[var(--po-card)] p-0 text-[14px] font-semibold text-[var(--po-accent)] shadow-[var(--po-shadow)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] ${
              isOpen
                ? "ring-2 ring-[var(--po-accent)] ring-offset-2 ring-offset-[var(--po-panel)]"
                : ""
            }`}
            style={{
              background:
                "color-mix(in oklch, var(--po-accent) 18%, var(--po-card))",
            }}
          >
            {initials}
            {isOwner && (
              <span
                title="Owner"
                className="absolute -top-[4px] -right-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-[10px] border-2 border-[var(--po-panel)] bg-[var(--po-ink)] text-[10px] text-[var(--po-panel)]"
              >
                <Crown size={11} />
              </span>
            )}
          </button>

          {isHovered && !isOpen && (
            <div
              role="tooltip"
              className="pointer-events-none absolute right-[58px] top-1/2 z-[90] flex -translate-y-1/2 items-center whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
            >
              <span>{displayName}</span>
              {isOwner && (
                <span className="pl-2 font-normal opacity-55">Owner</span>
              )}
            </div>
          )}
        </div>

        {/* User Menu Card Dropdown */}
        {isOpen && (
          <div className="w-[248px] rounded-[18px] border border-[var(--po-line)] bg-[var(--po-card)] p-[6px] shadow-[var(--po-shadow-lg)] flex flex-col gap-[2px]">
            {/* Header: User Initials + Display Name + Owner Badge */}
            <div className="flex items-center gap-3 p-[10px_10px_12px]">
              <span
                className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-[18px] text-[13px] font-semibold text-[var(--po-accent)]"
                style={{
                  background:
                    "color-mix(in oklch, var(--po-accent) 18%, var(--po-card))",
                }}
              >
                {initials}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[14px] font-semibold text-[var(--po-ink)]">
                  {displayName}
                </span>
                {isOwner && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--po-ink-3)]">
                    <Crown size={12} />
                    Owner
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-1.5 mb-1 h-[1px] bg-[var(--po-line)]" />

            {/* Profile (Disabled) */}
            <div
              aria-disabled="true"
              className="flex h-[38px] cursor-not-allowed items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] text-[var(--po-ink)] opacity-45"
            >
              <User size={16} className="text-[var(--po-ink-2)]" />
              <span>Profile</span>
              <span className="ml-auto rounded-full border border-dashed border-[var(--po-line-2)] px-[7px] py-[1px] text-[11px] text-[var(--po-ink-3)]">
                Soon
              </span>
            </div>

            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to Light mode" : "Switch to Dark mode"}
              className="flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-none bg-transparent px-2.5 text-left text-[13px] font-normal text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            >
              {dark ? (
                <Moon size={16} className="text-[var(--po-ink-2)]" />
              ) : (
                <Sun size={16} className="text-[var(--po-ink-2)]" />
              )}
              <span>{dark ? "Dark mode" : "Light mode"}</span>
              {/* Toggle switch track + knob */}
              <span
                className="relative ml-auto h-[18px] w-[32px] flex-none rounded-[9px] transition-colors duration-150"
                style={{
                  background: dark
                    ? "var(--po-accent)"
                    : "var(--po-line-2)",
                }}
              >
                <span
                  className="absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-[7px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-150"
                  style={{
                    transform: dark ? "translateX(14px)" : "translateX(0px)",
                  }}
                />
              </span>
            </button>

            {/* Divider */}
            <div className="mx-1.5 my-1 h-[1px] bg-[var(--po-line)]" />

            {/* Log Out */}
            <form action={logoutAction} className="m-0 p-0">
              <button
                type="submit"
                aria-label="Log out"
                className="flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-none bg-transparent px-2.5 text-left text-[13px] font-normal text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
              >
                <LogOut size={16} className="text-[var(--po-ink-2)]" />
                <span>Log out</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

// Re-export alias for compatibility
export { AvatarMenu as PageSwitcher };
export default AvatarMenu;
