"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavSection = "project" | "assets" | "reports" | "settings";
export type AssetsSubsection = "manage" | "assembly";

export type VerticalNavProps = {
  active?: NavSection;
  activeAssetsSubsection?: AssetsSubsection;
};

type NavItemDef = {
  id: string;
  label: string;
  href: string;
  dividerX: number;
  labelOffset: number;
  isActive: boolean;
};

export const VerticalNav: React.FC<VerticalNavProps> = ({
  active,
  activeAssetsSubsection,
}) => {
  const pathname = usePathname() || "";

  const isAssetsRoute =
    active === "assets" || pathname.startsWith("/assets");

  const isProjectActive =
    active === "project" ||
    (!active && (pathname.startsWith("/projects") || pathname === "/"));

  const isAssetsActive =
    active === "assets" || (!active && pathname.startsWith("/assets"));

  const isManageActive =
    activeAssetsSubsection === "manage" ||
    (!activeAssetsSubsection &&
      (pathname.startsWith("/assets/manage") ||
        (pathname.startsWith("/assets") && !pathname.startsWith("/assets/assembly"))));

  const isAssemblyActive =
    activeAssetsSubsection === "assembly" ||
    (!activeAssetsSubsection && pathname.startsWith("/assets/assembly"));

  const isReportsActive =
    active === "reports" || (!active && pathname.startsWith("/reports"));

  const isSettingsActive =
    active === "settings" || (!active && pathname.startsWith("/settings"));

  const items: NavItemDef[] = isAssetsRoute
    ? [
        {
          id: "project",
          label: "PROJECT",
          href: "/projects",
          dividerX: 0,
          labelOffset: 15,
          isActive: isProjectActive,
        },
        {
          id: "assets",
          label: "ASSETS",
          href: "/assets/manage",
          dividerX: 83,
          labelOffset: 98,
          isActive: isAssetsActive,
        },
        {
          id: "manage",
          label: "MANAGE",
          href: "/assets/manage",
          dividerX: 171,
          labelOffset: 186,
          isActive: isManageActive,
        },
        {
          id: "assembly",
          label: "ASSEMBLY",
          href: "/assets/assembly",
          dividerX: 263,
          labelOffset: 278,
          isActive: isAssemblyActive,
        },
        {
          id: "reports",
          label: "REPORTS",
          href: "/reports",
          dividerX: 354,
          labelOffset: 369,
          isActive: isReportsActive,
        },
        {
          id: "settings",
          label: "SETTING",
          href: "/settings",
          dividerX: 434,
          labelOffset: 449,
          isActive: isSettingsActive,
        },
      ]
    : [
        {
          id: "project",
          label: "PROJECT",
          href: "/projects",
          dividerX: 0,
          labelOffset: 15,
          isActive: isProjectActive,
        },
        {
          id: "assets",
          label: "ASSETS",
          href: "/assets/manage",
          dividerX: 83,
          labelOffset: 98,
          isActive: isAssetsActive,
        },
        {
          id: "reports",
          label: "REPORTS",
          href: "/reports",
          dividerX: 162,
          labelOffset: 177,
          isActive: isReportsActive,
        },
        {
          id: "settings",
          label: "SETTING",
          href: "/settings",
          dividerX: 242,
          labelOffset: 257,
          isActive: isSettingsActive,
        },
      ];

  const frameWidth = isAssetsRoute ? 460 : 268;
  const frameHeight = isAssetsRoute ? 152 : 150;
  const topPos = isAssetsRoute ? 39 : 38;

  return (
    <>
      <nav
        aria-label="Main Navigation"
        style={{
          position: "fixed",
          top: `${topPos}px`,
          right: "20px", // x = 1900 right edge on 1920 canvas (1920 - 1900 = 20)
          width: `${frameWidth}px`,
          height: `${frameHeight}px`,
          zIndex: 50,
        }}
        className="relative flex flex-row items-start justify-start select-none overflow-hidden pointer-events-auto font-sans"
      >
        {items.map((item) => (
          <React.Fragment key={item.id}>
            {/* Divider (starts at frame y + 0) */}
            <div
              style={{ left: `${item.dividerX}px`, top: "0px" }}
              className="absolute w-[1px] h-[138px] bg-[var(--color-line,#000000)] z-10"
            />

            {/* Active Bar: 34 x 138 at divider x (starts at frame y + 0) */}
            {item.isActive && (
              <div
                style={{ left: `${item.dividerX}px`, top: "0px" }}
                className="absolute w-[34px] h-[138px] bg-[var(--color-nav-active,#d9d9d9)] z-0"
              />
            )}

            {/* Nav Link & Label (11 wide x 138 tall, starts at frame y + 12, 15px in from divider) */}
            <Link
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              style={{ left: `${item.labelOffset}px`, top: "12px" }}
              className="absolute w-[11px] h-[138px] flex items-center justify-center text-[var(--color-ink,#000000)] font-sans select-none font-medium text-center z-20 outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              <span
                style={{
                  fontSize: "var(--text-nav, 9px)",
                  writingMode: "vertical-rl",
                  textOrientation: "upright",
                  lineHeight: "1",
                  letterSpacing: "normal",
                  height: "138px",
                  overflow: "visible",
                  display: "inline-block",
                  width: "11px",
                }}
              >
                {item.label}
              </span>
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Decorative underline rect on Assets pages (364 x 14 at 1565, 185) */}
      {isAssetsRoute && (
        <div
          style={{
            position: "fixed",
            left: "1565px",
            top: "185px",
            width: "364px",
            height: "14px",
            borderRadius: "7px",
            backgroundColor: "var(--color-selection,#d9d9d9)",
            zIndex: 49,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
};

export default VerticalNav;
