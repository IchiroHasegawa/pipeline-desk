import type { LucideIcon } from "lucide-react";
import {
  FolderKanban,
  Boxes,
  Layers,
  ChartColumn,
  Settings,
} from "lucide-react";

export interface PageRegistryItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
  tooltip?: string;
  isActive: (pathname: string) => boolean;
}

export const PAGE_REGISTRY: readonly PageRegistryItem[] = [
  {
    key: "projects",
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    enabled: true,
    isActive: (pathname: string) =>
      pathname === "/" || pathname.startsWith("/projects"),
  },
  {
    key: "assets",
    label: "Assets",
    href: "/assets/manage",
    icon: Boxes,
    enabled: true,
    isActive: (pathname: string) => pathname.startsWith("/assets/manage"),
  },
  {
    key: "assetAssembly",
    label: "Asset Assembly",
    href: "/assets/assembly",
    icon: Layers,
    enabled: true,
    isActive: (pathname: string) => pathname.startsWith("/assets/assembly"),
  },
  {
    key: "reports",
    label: "Reports",
    icon: ChartColumn,
    enabled: false,
    href: "/reports",
    tooltip: "Coming soon",
    isActive: (pathname: string) => pathname.startsWith("/reports"),
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    enabled: true,
    isActive: (pathname: string) => pathname.startsWith("/settings"),
  },
] as const;

/**
 * Returns the most specific active page match for a given pathname.
 * If no page matches (e.g. preview or unmapped route), falls back to the default
 * page or undefined.
 */
export function getCurrentPage(pathname: string): PageRegistryItem | undefined {
  // Sort descending by pattern specificity / href length to ensure most specific match wins
  const matches = PAGE_REGISTRY.filter((p) => p.isActive(pathname));
  if (matches.length === 0) {
    return undefined;
  }
  return matches.reduce((mostSpecific, curr) =>
    curr.href.length > mostSpecific.href.length ? curr : mostSpecific
  );
}
