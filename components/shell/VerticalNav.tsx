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

type ItemConfig = {
  id: string;
  label: string;
  href: string;
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

  const items: ItemConfig[] = [
    {
      id: "project",
      label: "PROJECT",
      href: "/projects",
      isActive: isProjectActive,
    },
    {
      id: "assets",
      label: "ASSETS",
      href: "/assets/manage",
      isActive: isAssetsActive && !pathname.startsWith("/assets/assembly"),
    },
  ];

  if (isAssetsRoute) {
    items.push(
      {
        id: "manage",
        label: "MANAGE",
        href: "/assets/manage",
        isActive: isManageActive,
      },
      {
        id: "assembly",
        label: "ASSEMBLY",
        href: "/assets/assembly",
        isActive: isAssemblyActive,
      }
    );
  }

  items.push(
    {
      id: "reports",
      label: "REPORTS",
      href: "/reports",
      isActive: isReportsActive,
    },
    {
      id: "settings",
      label: "SETTING",
      href: "/settings",
      isActive: isSettingsActive,
    }
  );

  return (
    <nav
      aria-label="Main Navigation"
      style={{
        position: "fixed",
        top: "calc((38 / 1080) * 100vh)",
        right: "40px",
        width: "460px",
        height: "152px",
        zIndex: 50,
      }}
      className="flex flex-row items-start justify-end gap-0 select-none overflow-hidden pointer-events-auto"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={item.isActive ? "page" : undefined}
          className={`group relative flex items-center justify-center w-[34px] h-[138px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 rounded-[var(--radius-xs,1px)] ${
            item.isActive
              ? "bg-[var(--color-nav-active,#d9d9d9)]"
              : "bg-transparent hover:bg-[var(--color-nav-idle,#ededed)] border-l border-[var(--color-line,#000000)]"
          }`}
        >
          <span
            className="text-[var(--text-nav,9px)] text-[var(--color-ink,#000000)] font-sans select-none font-medium text-center"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "upright",
              letterSpacing: "0.08em",
              lineHeight: "1",
            }}
          >
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
};

export default VerticalNav;
