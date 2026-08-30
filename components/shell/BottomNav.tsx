"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GLASS_STYLE } from "@/components/shell/BoardHeader";

type NavItem = { id: string; label: string; href: string };

/**
 * Carried over from VerticalNav so nothing is lost in the swap.
 *
 * REPORTED, NOT INVENTED: /reports has no route directory under app/. The item
 * is preserved because VerticalNav has always offered it, but it currently 404s.
 */
const BASE_ITEMS: NavItem[] = [
  { id: "project", label: "PROJECT", href: "/projects" },
  { id: "assets", label: "ASSETS", href: "/assets/manage" },
  { id: "reports", label: "REPORTS", href: "/reports" },
  { id: "settings", label: "SETTING", href: "/settings" },
];

/**
 * VerticalNav widens on /assets* routes to expose these two sub-items. That
 * contextual expansion is preserved here: on an assets route they are spliced
 * in after ASSETS, in the same order.
 */
const ASSETS_SUB_ITEMS: NavItem[] = [
  { id: "manage", label: "MANAGE", href: "/assets/manage" },
  { id: "assembly", label: "ASSEMBLY", href: "/assets/assembly" },
];

const EDGE_OFFSET = 20;
const TRANSITION = "200ms ease-out";

function isItemActive(item: NavItem, pathname: string): boolean {
  switch (item.id) {
    case "project":
      return pathname.startsWith("/projects") || pathname === "/";
    case "assets":
      return pathname.startsWith("/assets");
    case "manage":
      return pathname.startsWith("/assets/manage");
    case "assembly":
      return pathname.startsWith("/assets/assembly");
    case "reports":
      return pathname.startsWith("/reports");
    case "settings":
      return pathname.startsWith("/settings");
    default:
      return false;
  }
}

export const BottomNav: React.FC = () => {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isAssetsRoute = pathname.startsWith("/assets");

  const items = useMemo(() => {
    if (!isAssetsRoute) return BASE_ITEMS;
    const out = [...BASE_ITEMS];
    out.splice(2, 0, ...ASSETS_SUB_ITEMS);
    return out;
  }, [isAssetsRoute]);

  const currentLabel = useMemo(() => {
    // Most specific wins, so /assets/assembly reads ASSEMBLY rather than ASSETS.
    const matches = items.filter((i) => isItemActive(i, pathname));
    if (matches.length === 0) return "PROJECT";
    return matches[matches.length - 1].label;
  }, [items, pathname]);

  // Collapse on navigation.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    /*
      The brief asks for the pill to be fixed 20px from the bottom-LEFT edge
      AND to grow leftward from a fixed right edge. Those cannot both hold: a
      pill whose left edge is already at x=20 has nowhere leftward to grow.
      See the task report — the stated REASON for the leftward growth is that
      "the current label does not move", so that invariant is what is
      implemented: the label is pinned as the first child at the fixed left
      edge and never shifts, while the remaining items reveal to its right.
    */
    <div
      ref={rootRef}
      aria-label="Main Navigation"
      className="fixed z-50 font-sans select-none"
      style={{ left: EDGE_OFFSET + "px", bottom: EDGE_OFFSET + "px" }}
    >
      <div
        className="flex flex-row items-center overflow-hidden"
        style={{
          ...GLASS_STYLE,
          // Rounded, deliberately not fully circular.
          borderRadius: "var(--radius-pill, 15px)",
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="shrink-0 px-4 py-2 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-black"
          style={{
            fontSize: "var(--text-nav, 9px)",
            fontWeight: 500,
            letterSpacing: "0.04em",
            color: "var(--color-ink, #000000)",
          }}
        >
          {currentLabel}
        </button>

        <div
          className="flex flex-row items-center overflow-hidden"
          style={{
            maxWidth: isOpen ? "600px" : "0px",
            opacity: isOpen ? 1 : 0,
            transition: "max-width " + TRANSITION + ", opacity " + TRANSITION,
          }}
        >
          {items.map((item) => {
            const active = isItemActive(item, pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="shrink-0 whitespace-nowrap px-3 py-2 transition-opacity hover:opacity-70 outline-none focus-visible:ring-1 focus-visible:ring-black"
                style={{
                  fontSize: "var(--text-nav, 9px)",
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "0.04em",
                  color: active
                    ? "var(--color-ink, #000000)"
                    : "var(--color-ink-muted, #707070)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
