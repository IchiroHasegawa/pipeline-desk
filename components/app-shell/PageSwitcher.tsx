"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  User,
  Moon,
  Sun,
  LogOut,
  FolderKanban,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { logoutAction } from "@/app/actions/auth";
import { PAGE_REGISTRY, getCurrentPage } from "./pageRegistry";
import { useCurrentProfile } from "./useCurrentProfile";

export interface PageSwitcherProps {
  currentPageKey?: string;
  currentPageLabel?: string;
}

export const PageSwitcher: React.FC<PageSwitcherProps> = ({
  currentPageKey,
  currentPageLabel,
}) => {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close when pathname changes without an effect (React standard pattern)
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
        setActiveTip(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Determine current page from props or registry
  const matchedPage = getCurrentPage(pathname);
  const activeKey = currentPageKey || matchedPage?.key || "projects";
  const displayLabel = currentPageLabel || matchedPage?.label || "Projects";
  const CurrentIcon = matchedPage?.icon || FolderKanban;

  return (
    <>
      {/* Outside click backdrop */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            setActiveTip(null);
          }}
          className="fixed inset-0 z-[70]"
          aria-hidden="true"
        />
      )}

      {/* Fixed top-right container */}
      <div className="fixed top-[28px] right-[28px] z-[80] flex flex-col items-center gap-2">
        {/* Avatar Circle */}
        <div
          className="relative"
          onMouseEnter={() => !isOpen && setActiveTip("avatar")}
          onMouseLeave={() => setActiveTip((curr) => (curr === "avatar" ? null : curr))}
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setActiveTip(null);
            }}
            onFocus={() => !isOpen && setActiveTip("avatar")}
            onBlur={() => setActiveTip((curr) => (curr === "avatar" ? null : curr))}
            aria-label="Account and pages"
            className="relative flex h-[48px] w-[48px] items-center justify-center rounded-[24px] border-2 border-[var(--po-card)] p-0 text-[14px] font-semibold text-[var(--po-accent)] shadow-[var(--po-shadow)] transition-all hover:shadow-[var(--po-shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
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

          {activeTip === "avatar" && !isOpen && (
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

        {/* Current Page Circle */}
        <div
          className="relative"
          onMouseEnter={() => !isOpen && setActiveTip("page")}
          onMouseLeave={() => setActiveTip((curr) => (curr === "page" ? null : curr))}
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setActiveTip(null);
            }}
            onFocus={() => !isOpen && setActiveTip("page")}
            onBlur={() => setActiveTip((curr) => (curr === "page" ? null : curr))}
            aria-label="Switch page"
            aria-expanded={isOpen}
            className={`flex h-[48px] w-[48px] items-center justify-center rounded-[24px] p-0 shadow-[var(--po-shadow)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] ${
              isOpen
                ? "border-none bg-[var(--po-ink)] text-[var(--po-panel)]"
                : "border border-[var(--po-line)] bg-[var(--po-card)] text-[var(--po-ink)] hover:text-[var(--po-ink)]"
            }`}
          >
            <CurrentIcon size={19} />
          </button>

          {activeTip === "page" && !isOpen && (
            <div
              role="tooltip"
              className="pointer-events-none absolute right-[58px] top-1/2 z-[90] flex -translate-y-1/2 items-center whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
            >
              <span>{displayLabel}</span>
            </div>
          )}
        </div>

        {/* Open Vertical Bar Dropdown */}
        {isOpen && (
          <div className="mt-[2px] flex flex-col items-center gap-1 rounded-[28px] border border-[var(--po-line)] bg-[var(--po-card)] p-[5px] shadow-[var(--po-shadow-lg)]">
            {/* 1. User Profile (Disabled Placeholder) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveTip("u-profile")}
              onMouseLeave={() => setActiveTip(null)}
            >
              <button
                type="button"
                disabled
                aria-label="Profile"
                className="flex h-[40px] w-[40px] cursor-not-allowed items-center justify-center rounded-[20px] border-none bg-transparent p-0 text-[var(--po-ink-3)] opacity-40"
              >
                <User size={17} />
              </button>
              {activeTip === "u-profile" && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute right-[52px] top-1/2 z-[90] flex -translate-y-1/2 items-center whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
                >
                  <span>Profile</span>
                  <span className="pl-2 font-normal opacity-55">Coming soon</span>
                </div>
              )}
            </div>

            {/* 2. Light / Dark Theme Toggle */}
            <div
              className="relative"
              onMouseEnter={() => setActiveTip("u-theme")}
              onMouseLeave={() => setActiveTip(null)}
            >
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Dark mode" : "Light mode"}
                className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-[20px] border-none bg-transparent p-0 text-[var(--po-ink-2)] transition-colors hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
              >
                {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
              </button>
              {activeTip === "u-theme" && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute right-[52px] top-1/2 z-[90] flex -translate-y-1/2 items-center whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
                >
                  <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
                </div>
              )}
            </div>

            {/* 3. Log out Form */}
            <div
              className="relative"
              onMouseEnter={() => setActiveTip("u-logout")}
              onMouseLeave={() => setActiveTip(null)}
            >
              <form action={logoutAction} className="m-0 p-0">
                <button
                  type="submit"
                  aria-label="Log out"
                  className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-[20px] border-none bg-transparent p-0 text-[var(--po-ink-2)] transition-colors hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
                >
                  <LogOut size={17} />
                </button>
              </form>
              {activeTip === "u-logout" && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute right-[52px] top-1/2 z-[90] flex -translate-y-1/2 items-center whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
                >
                  <span>Log out</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-[3px] h-[1px] w-[22px] bg-[var(--po-line-2)]" />

            {/* Registered App Pages */}
            {PAGE_REGISTRY.map((p) => {
              const Icon = p.icon;
              const isCurrent = p.key === activeKey;
              const tipKey = `p-${p.key}`;

              return (
                <div
                  key={p.key}
                  className="relative"
                  onMouseEnter={() => setActiveTip(tipKey)}
                  onMouseLeave={() => setActiveTip(null)}
                >
                  {p.enabled ? (
                    <Link
                      href={p.href}
                      onClick={() => {
                        setIsOpen(false);
                        setActiveTip(null);
                      }}
                      aria-label={p.label}
                      className={`flex h-[40px] w-[40px] items-center justify-center rounded-[20px] border-none p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] ${
                        isCurrent
                          ? "bg-[var(--po-ink)] text-[var(--po-panel)]"
                          : "bg-transparent text-[var(--po-ink-2)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)]"
                      }`}
                    >
                      <Icon size={17} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      aria-label={p.label}
                      className="flex h-[40px] w-[40px] cursor-not-allowed items-center justify-center rounded-[20px] border-none bg-transparent p-0 text-[var(--po-ink-2)] opacity-35"
                    >
                      <Icon size={17} />
                    </button>
                  )}

                  {activeTip === tipKey && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute right-[52px] top-1/2 z-[90] flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
                    >
                      <span>{p.label}</span>
                      {p.tooltip && (
                        <span className="font-normal opacity-55">
                          {p.tooltip}
                        </span>
                      )}
                      {isCurrent && !p.tooltip && (
                        <span className="font-normal opacity-55">Current</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
