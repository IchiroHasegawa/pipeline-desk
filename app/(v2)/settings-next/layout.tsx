// TEMPORARY route — becomes /settings at cutover
"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Users,
  Shield,
  Workflow,
  HardDrive,
  ArrowLeft,
} from "lucide-react";
import { AppShell, type RailAction } from "@/components/app-shell";
import { projectsHref, settingsHref } from "@/lib/routes/app";

interface SectionConfig {
  key: string;
  label: string;
  icon: typeof FolderKanban;
  path: string;
}

const SECTIONS: readonly SectionConfig[] = [
  { key: "projects", label: "Projects", icon: FolderKanban, path: settingsHref("projects") },
  { key: "users", label: "Users", icon: Users, path: settingsHref("users") },
  { key: "security", label: "Security", icon: Shield, path: settingsHref("security") },
  { key: "workflows", label: "Workflows", icon: Workflow, path: settingsHref("workflows") },
  { key: "storage", label: "Storage", icon: HardDrive, path: settingsHref("storage") },
];

export default function SettingsNextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const currentSection = useMemo(() => {
    return (
      SECTIONS.find((s) => pathname.startsWith(s.path)) ||
      SECTIONS[0]
    );
  }, [pathname]);

  const railActions: readonly RailAction[] = useMemo(() => {
    return SECTIONS.map((s) => ({
      key: s.key,
      label: s.label,
      icon: s.icon,
      href: s.path,
      active: pathname.startsWith(s.path),
    }));
  }, [pathname]);

  const bottomAction: RailAction = useMemo(() => ({
    key: "back-to-projects",
    label: "Back to Projects",
    icon: ArrowLeft,
    href: projectsHref(),
  }), []);

  const breadcrumb = useMemo(() => [
    { label: "Settings", href: settingsHref("projects") },
    { label: currentSection.label },
  ], [currentSection]);

  return (
    <AppShell
      actions={railActions}
      bottomAction={bottomAction}
      railLabel="SETTINGS"
      breadcrumb={breadcrumb}
      header={{ title: currentSection.label }}
      contentClassName="overflow-auto px-[36px] pt-1 pb-[36px]"
    >
      {children}
    </AppShell>
  );
}
