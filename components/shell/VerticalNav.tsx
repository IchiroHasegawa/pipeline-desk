"use client";

import React from "react";

export type NavSection = "project" | "assets" | "reports" | "settings";
export type AssetsSubsection = "manage" | "assembly";

export type VerticalNavProps = {
  active: NavSection;
  activeAssetsSubsection?: AssetsSubsection;
};

type ItemConfig = {
  id: string;
  label: string;
  bgClass: string;
};

export const VerticalNav: React.FC<VerticalNavProps> = ({
  active,
  activeAssetsSubsection,
}) => {
  const items: ItemConfig[] = [
    {
      id: "project",
      label: "PROJECT",
      bgClass: active === "project" ? "bg-[var(--color-nav-active)]" : "bg-transparent",
    },
    {
      id: "assets",
      label: "ASSETS",
      bgClass: active === "assets" ? "bg-[var(--color-nav-active)]" : "bg-transparent",
    },
  ];

  if (active === "assets") {
    items.push(
      {
        id: "manage",
        label: "MANAGE",
        bgClass:
          activeAssetsSubsection === "manage" || !activeAssetsSubsection
            ? "bg-[var(--color-nav-active)]"
            : "bg-[var(--color-nav-idle)]",
      },
      {
        id: "assembly",
        label: "ASSEMBLY",
        bgClass:
          activeAssetsSubsection === "assembly"
            ? "bg-[var(--color-nav-active)]"
            : "bg-[var(--color-nav-idle)]",
      }
    );
  }

  items.push(
    {
      id: "reports",
      label: "REPORTS",
      bgClass: active === "reports" ? "bg-[var(--color-nav-active)]" : "bg-transparent",
    },
    {
      id: "settings",
      label: "SETTING",
      bgClass: active === "settings" ? "bg-[var(--color-nav-active)]" : "bg-transparent",
    }
  );

  return (
    <nav aria-label="Main Navigation" className="flex flex-row items-start justify-end gap-0">
      {items.map((item) => (
        <div key={item.id} className="flex flex-row items-start h-[var(--size-nav-bar-height,138px)]">
          {/* Vertical Bar */}
          <div
            className={`w-[var(--size-nav-bar-width,34px)] h-[var(--size-nav-bar-height,138px)] ${item.bgClass}`}
          />
          {/* 1px Divider on label's left */}
          <div className="w-[var(--stroke-regular,1px)] h-full bg-[var(--color-line,#000000)]" />
          {/* Vertical Label */}
          <div className="px-1.5 flex items-center justify-center h-full">
            <span
              className="text-[var(--text-nav,9px)] text-[var(--color-ink,#000000)] font-sans select-none tracking-widest"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "upright",
              }}
            >
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </nav>
  );
};

export default VerticalNav;
