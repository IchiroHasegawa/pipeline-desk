// TEMPORARY — remove when the redesign cutover is complete.

"use client";

import React, { useState } from "react";
import { Plus, Trash2, SlidersHorizontal, Search } from "lucide-react";
import {
  AppShell,
  Skeleton,
  type RailAction,
} from "@/components/app-shell";

export default function ShellPreviewPage() {
  const [searchActive, setSearchActive] = useState(false);

  const projectActions: RailAction[] = [
    {
      key: "create-project",
      label: "Create project",
      icon: Plus,
      onSelect: () => console.log("Create project clicked"),
    },
    {
      key: "delete-project",
      label: "Delete project",
      icon: Trash2,
      hint: "Select a project first",
      disabled: true,
      onSelect: () => console.log("Delete project clicked"),
    },
    {
      key: "manage-project",
      label: "Manage project",
      icon: SlidersHorizontal,
      onSelect: () => console.log("Manage project clicked"),
    },
  ];

  const bottomAction: RailAction = {
    key: "search-projects",
    label: "Search projects",
    icon: Search,
    active: searchActive,
    onSelect: () => setSearchActive((prev) => !prev),
  };

  return (
    <AppShell
      actions={projectActions}
      bottomAction={bottomAction}
      railLabel="PROJECTS"
      breadcrumb={[{ label: "Projects" }]}
      header={{
        title: "Projects",
        count: 3,
      }}
    >
      <Skeleton variant="cards" count={3} />
    </AppShell>
  );
}
