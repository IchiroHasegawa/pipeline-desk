// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import React from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/app-shell";

export default function UsersSettings() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-[640px] rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] p-8 shadow-[var(--po-shadow-sm)]">
        <EmptyState
          icon={Users}
          title="Users"
          description="User management and role assignments are coming soon in a future release."
        />
      </div>
    </div>
  );
}
