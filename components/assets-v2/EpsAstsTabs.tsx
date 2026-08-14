"use client";

import React, { memo } from "react";

export type EpsAstsTabsProps = {
  activeTab: "eps" | "asts";
  onTabChange: (tab: "eps" | "asts") => void;
};

/**
 * Eps. / Asts. tabs — DESIGN_SPEC §11.
 * Eps. tab (148, 177) and Asts. tab (206, 177), 66 × 32 each — they overlap by
 * 8px as stacked file tabs. Rule under the tabs (43, 177) 1353.5 × 1.
 * Active tab is lighter (`--color-selection`), inactive darker. Eps. is default.
 *
 * Coordinates are absolute on the 1920 frame, so this renders as a positioned
 * fragment rather than a flow container.
 */
const TABS: { id: "eps" | "asts"; label: string; x: number }[] = [
  { id: "eps", label: "Eps.", x: 148 },
  { id: "asts", label: "Asts.", x: 206 },
];

export const EpsAstsTabsComponent: React.FC<EpsAstsTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <>
      {/* Rule under the tabs (43, 177) 1353.5 × 1 */}
      <div className="absolute left-[43px] top-[177px] w-[1353.5px] h-[1px] bg-[var(--color-line,#000000)]" />

      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            style={{ left: `${tab.x}px`, zIndex: isActive ? 20 : 10 }}
            className={`absolute top-[177px] w-[66px] h-[32px] rounded-b-[var(--radius-sm,3px)] border border-t-0 border-[var(--color-line,#000000)] text-[var(--text-caption,11px)] font-medium cursor-pointer transition-colors ${
              isActive
                ? "bg-[var(--color-selection,#d9d9d9)] text-[var(--color-ink,#000000)]"
                : "bg-[var(--color-ink-muted,#707070)] text-[var(--color-canvas,#ffffff)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </>
  );
};

export const EpsAstsTabs = memo(EpsAstsTabsComponent);
export default EpsAstsTabs;
