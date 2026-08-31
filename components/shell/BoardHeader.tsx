"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { HAIRLINE } from "@/lib/design/boardTokens";
import { useTheme } from "@/components/theme/ThemeProvider";

export type BoardHeaderProps = {
  createLabel: string;
  manageLabel?: string;
  onCreate: () => void;
  onManage?: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
};

const AVATAR_SIZE = 34;

/** Shared with BottomNav so the two pieces of chrome read as one material. */
export const GLASS_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-glass, rgba(255, 255, 255, 0.72))",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
  boxShadow: "var(--shadow-glass, 0 8px 24px rgba(0, 0, 0, 0.10))",
};

const Rule: React.FC = () => (
  <span
    aria-hidden="true"
    className="self-stretch shrink-0"
    style={{
      width: HAIRLINE,
      backgroundColor: "var(--color-line-soft, #a9a9a9)",
    }}
  />
);

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  createLabel,
  manageLabel,
  onCreate,
  onManage,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Quick Search",
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  const buttonClass =
    "shrink-0 whitespace-nowrap px-3 py-1.5 cursor-pointer transition-opacity hover:opacity-70 outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)]";

  const handleToggleMenu = useCallback(() => setIsMenuOpen((v) => !v), []);

  return (
    <div className="w-full flex flex-row items-center gap-3 font-sans select-none">
      <button
        type="button"
        onClick={onCreate}
        className={buttonClass}
        style={{
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink, #000000)",
        }}
      >
        {createLabel}
      </button>

      {manageLabel && (
        <>
          <Rule />
          <button
            type="button"
            onClick={onManage}
            className={buttonClass}
            style={{
              fontSize: "var(--text-caption, 11px)",
              color: "var(--color-ink, #000000)",
            }}
          >
            {manageLabel}
          </button>
        </>
      )}

      <Rule />

      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="shrink-0 w-[200px] px-3 py-1.5 outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)]"
        style={{
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink, #000000)",
          backgroundColor: "var(--color-panel, #f0f0f0)",
          borderRadius: "var(--radius-sm, 3px)",
        }}
      />

      {/* Rule filling the remaining width, up to the avatar. */}
      <span
        aria-hidden="true"
        className="flex-1 min-w-0"
        style={{
          height: HAIRLINE,
          backgroundColor: "var(--color-line, #000000)",
        }}
      />

      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={handleToggleMenu}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label="Account menu"
          className="block rounded-full cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)]"
          style={{
            width: AVATAR_SIZE + "px",
            height: AVATAR_SIZE + "px",
            backgroundColor: "var(--color-placeholder, #d9d9d9)",
            border: HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
          }}
        />

        {isMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] w-[168px] p-1 z-50"
            style={{
              ...GLASS_STYLE,
              borderRadius: "var(--radius-card, 7px)",
            }}
          >
            <div
              role="menuitem"
              aria-disabled="true"
              className="px-3 py-2 rounded-[var(--radius-sm,3px)] cursor-default"
              style={{
                fontSize: "var(--text-caption, 11px)",
                color: "var(--color-ink-muted, #707070)",
              }}
            >
              Profile
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-[var(--radius-sm,3px)] cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10 outline-none"
              style={{
                fontSize: "var(--text-caption, 11px)",
                color: "var(--color-ink, #000000)",
              }}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardHeader;
