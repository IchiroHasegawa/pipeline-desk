"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { PAGE_REGISTRY, getCurrentPage } from "./pageRegistry";

export interface RailAction {
  key: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  kbd?: string;
  onSelect?: () => void;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}

export interface ActionRailProps {
  actions: readonly RailAction[];
  bottomAction?: RailAction;
  railLabel?: string;
}

export const ActionRail: React.FC<ActionRailProps> = ({
  actions,
  bottomAction,
  // railLabel retained in props for compatibility, not rendered in v2 design
}) => {
  const pathname = usePathname() || "";
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close when pathname changes
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsSwitcherOpen(false);
  }

  // Close on Escape key
  useEffect(() => {
    if (!isSwitcherOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSwitcherOpen(false);
        setActiveTooltip(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSwitcherOpen]);

  // Determine current active page for top rail switcher
  const matchedPage = getCurrentPage(pathname);
  const CurrentIcon = matchedPage?.icon ?? PAGE_REGISTRY[0].icon;
  const currentLabel = matchedPage?.label ?? "Projects";

  const renderActionButton = (action: RailAction, isBottom = false) => {
    const Icon = action.icon;
    const isHovered = activeTooltip === action.key;
    const tooltipLeft = isBottom ? "left-[62px]" : "left-[56px]";

    const content = (
      <div
        className="relative flex items-center justify-center"
        onMouseEnter={() => setActiveTooltip(action.key)}
        onMouseLeave={() => setActiveTooltip((curr) => (curr === action.key ? null : curr))}
        onFocus={() => setActiveTooltip(action.key)}
        onBlur={() => setActiveTooltip((curr) => (curr === action.key ? null : curr))}
      >
        {action.href && !action.disabled ? (
          <Link
            href={action.href}
            aria-label={action.label}
            className={`flex h-[44px] w-[44px] items-center justify-center rounded-[22px] border-none p-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--po-rail)] ${
              action.active
                ? "bg-[var(--po-rail-active)] text-white"
                : "text-[var(--po-rail-ink)] hover:bg-[var(--po-rail-hover)] hover:text-white"
            }`}
          >
            <Icon size={19} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.disabled ? undefined : action.onSelect}
            aria-label={action.label}
            aria-disabled={action.disabled}
            disabled={action.disabled}
            className={`flex h-[44px] w-[44px] items-center justify-center rounded-[22px] border-none p-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--po-rail)] ${
              action.disabled
                ? "cursor-not-allowed text-[var(--po-rail-ink)] opacity-30"
                : action.active
                ? "cursor-pointer bg-[var(--po-rail-active)] text-white"
                : "cursor-pointer text-[var(--po-rail-ink)] hover:bg-[var(--po-rail-hover)] hover:text-white"
            }`}
          >
            <Icon size={19} />
          </button>
        )}

        {isHovered && (
          <div
            role="tooltip"
            className={`pointer-events-none absolute ${tooltipLeft} top-1/2 z-[90] flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]`}
          >
            <span>{action.label}</span>
            {action.hint && (
              <span className="font-normal opacity-55">{action.hint}</span>
            )}
            {action.kbd && (
              <span className="font-normal opacity-55">{action.kbd}</span>
            )}
          </div>
        )}
      </div>
    );

    return <React.Fragment key={action.key}>{content}</React.Fragment>;
  };

  return (
    <>
      {/* Outside click backdrop for page switcher */}
      {isSwitcherOpen && (
        <div
          onClick={() => {
            setIsSwitcherOpen(false);
            setActiveTooltip(null);
          }}
          className="fixed inset-0 z-[70]"
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Action Rail"
        className="relative z-[75] flex h-full w-[56px] flex-none flex-col justify-between"
      >
        {/* Top floating pill: Page Switcher + Actions */}
        <div className="flex w-[56px] flex-col items-center gap-1 rounded-[28px] bg-[var(--po-rail)] py-1.5 pb-2 shadow-[0_10px_28px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.2)]">
          {/* Top Switcher Button (Current Page Icon) */}
          <div
            className="relative flex items-center justify-center"
            onMouseEnter={() => !isSwitcherOpen && setActiveTooltip("page-switcher")}
            onMouseLeave={() =>
              setActiveTooltip((curr) => (curr === "page-switcher" ? null : curr))
            }
          >
            <button
              type="button"
              onClick={() => {
                setIsSwitcherOpen((prev) => !prev);
                setActiveTooltip(null);
              }}
              onFocus={() => !isSwitcherOpen && setActiveTooltip("page-switcher")}
              onBlur={() =>
                setActiveTooltip((curr) => (curr === "page-switcher" ? null : curr))
              }
              aria-label="Switch page"
              aria-expanded={isSwitcherOpen}
              className={`flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[22px] border-none p-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] ${
                isSwitcherOpen
                  ? "bg-white text-[#18181B]"
                  : "bg-white/[0.08] text-white hover:bg-white/[0.16]"
              }`}
            >
              <CurrentIcon size={19} />
            </button>

            {activeTooltip === "page-switcher" && !isSwitcherOpen && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-[56px] top-1/2 z-[90] flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
              >
                <span>{currentLabel}</span>
                <span className="font-normal opacity-55">Switch page</span>
              </div>
            )}
          </div>

          {/* Vertical Page List Attached to Rail */}
          {isSwitcherOpen && (
            <div className="my-0.5 flex w-[48px] flex-col items-center gap-1 rounded-[24px] bg-white/[0.06] py-1">
              {PAGE_REGISTRY.map((p) => {
                const Icon = p.icon;
                const isCurrent = matchedPage?.key === p.key;
                const tipKey = `p-${p.key}`;
                const isHovered = activeTooltip === tipKey;

                return (
                  <div
                    key={p.key}
                    className="relative flex items-center justify-center"
                    onMouseEnter={() => setActiveTooltip(tipKey)}
                    onMouseLeave={() =>
                      setActiveTooltip((curr) => (curr === tipKey ? null : curr))
                    }
                  >
                    {p.enabled ? (
                      <Link
                        href={p.href}
                        onClick={() => {
                          setIsSwitcherOpen(false);
                          setActiveTooltip(null);
                        }}
                        aria-label={p.label}
                        className={`flex h-[40px] w-[40px] items-center justify-center rounded-[20px] border-none p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] ${
                          isCurrent
                            ? "bg-white text-[#18181B]"
                            : "text-[var(--po-rail-ink)] hover:bg-[var(--po-rail-hover)] hover:text-white"
                        }`}
                      >
                        <Icon size={17} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-label={p.label}
                        className="flex h-[40px] w-[40px] cursor-not-allowed items-center justify-center rounded-[20px] border-none bg-transparent p-0 text-[var(--po-rail-ink)] opacity-35"
                      >
                        <Icon size={17} />
                      </button>
                    )}

                    {isHovered && (
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute left-[52px] top-1/2 z-[90] flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
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

          {/* Divider between switcher and page actions */}
          <div className="my-[2px] mb-1 h-[1px] w-[22px] bg-white/12" />

          {/* Page's own actions */}
          <div className="flex flex-col items-center gap-1">
            {actions.map((act) => renderActionButton(act, false))}
          </div>
        </div>

        {/* Bottom floating pill */}
        {bottomAction && (
          <div className="flex w-[56px] flex-col items-center gap-1 rounded-[28px] bg-[var(--po-rail)] py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.2)]">
            {renderActionButton(bottomAction, true)}
          </div>
        )}
      </aside>
    </>
  );
};
