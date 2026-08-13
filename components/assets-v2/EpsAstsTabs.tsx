"use client";

import React, { memo } from "react";

export type EpsAstsTabsProps = {
  activeTab: "eps" | "asts";
  onTabChange: (tab: "eps" | "asts") => void;
};

export const EpsAstsTabsComponent: React.FC<EpsAstsTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex flex-col gap-0 font-sans select-none w-full">
      <div className="flex flex-row items-center gap-0 text-[var(--text-caption,11px)]">
        <button
          type="button"
          onClick={() => onTabChange("eps")}
          className={`w-[66px] h-[32px] rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)] font-medium cursor-pointer transition-colors ${
            activeTab === "eps"
              ? "bg-[var(--color-selection,#d9d9d9)] text-[var(--color-ink,#000000)] z-10"
              : "bg-[var(--color-ink-muted,#707070)] text-[var(--color-canvas,#ffffff)] opacity-80"
          }`}
        >
          Eps.
        </button>
        <button
          type="button"
          onClick={() => onTabChange("asts")}
          className={`w-[66px] h-[32px] -ml-2 rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)] font-medium cursor-pointer transition-colors ${
            activeTab === "asts"
              ? "bg-[var(--color-selection,#d9d9d9)] text-[var(--color-ink,#000000)] z-10"
              : "bg-[var(--color-ink-muted,#707070)] text-[var(--color-canvas,#ffffff)] opacity-80"
          }`}
        >
          Asts.
        </button>
      </div>

      <div className="w-full max-w-[1353.5px] h-[1px] bg-[var(--color-line,#000000)]" />
    </div>
  );
};

export const EpsAstsTabs = memo(EpsAstsTabsComponent);
export default EpsAstsTabs;
