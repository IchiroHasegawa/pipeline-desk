"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clapperboard, type LucideIcon } from "lucide-react";
import { projectsHref } from "@/lib/routes/app";

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
  railLabel,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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
    <aside
      aria-label="Action Rail"
      className="flex h-full w-[68px] flex-none flex-col gap-3"
    >
      {/* Upper action container */}
      <div className="flex flex-1 min-h-0 flex-col items-center rounded-[34px] border border-[var(--po-line)] bg-[var(--po-panel)] p-[6px] shadow-[var(--po-shadow-sm)]">
        {/* Inner dark pill for actions */}
        <div className="flex w-[56px] flex-col items-center gap-1 rounded-[28px] bg-[var(--po-rail)] py-2 shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
          {/* Logo / Clapperboard */}
          <Link
            href={projectsHref()}
            aria-label="Production OS Home"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[22px] text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
          >
            <Clapperboard size={20} />
          </Link>

          {/* Divider */}
          <div className="my-1 h-[1px] w-[22px] bg-white/12" />

          {/* Rail actions */}
          <div className="flex flex-col items-center gap-1">
            {actions.map((act) => renderActionButton(act, false))}
          </div>
        </div>

        {/* Vertical page caption */}
        {railLabel && (
          <div className="flex flex-1 min-h-0 items-center justify-center">
            <span
              className="text-[10px] tracking-[0.26em] text-[var(--po-ink-3)] uppercase [writing-mode:vertical-rl] rotate-180"
              style={{ fontFamily: "ui-monospace, Menlo, monospace" }}
            >
              {railLabel}
            </span>
          </div>
        )}
      </div>

      {/* Bottom action container pill */}
      {bottomAction && (
        <div className="flex flex-none justify-center rounded-[34px] border border-[var(--po-line)] bg-[var(--po-panel)] p-[6px] shadow-[var(--po-shadow-sm)]">
          <div className="flex h-[56px] w-[56px] items-center justify-center rounded-[28px] bg-[var(--po-rail)]">
            {renderActionButton(bottomAction, true)}
          </div>
        </div>
      )}
    </aside>
  );
};
