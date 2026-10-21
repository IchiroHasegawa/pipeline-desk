import React from "react";
import { Folder, Plus, type LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No items yet",
  description = "Create your first item to get started.",
  icon: Icon = Folder,
  actionLabel = "Create item",
  onAction,
}) => {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="flex max-w-[380px] flex-col items-center gap-[14px] text-center">
        <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[22px] border border-[var(--po-line)] bg-[var(--po-card)] text-[26px] text-[var(--po-ink-3)] shadow-[var(--po-shadow-sm)]">
          <Icon size={26} />
        </div>
        <div className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--po-ink)]">
          {title}
        </div>
        <div className="text-[14px] leading-[1.55] text-[var(--po-ink-2)] [text-wrap:pretty]">
          {description}
        </div>
        {onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="mt-[6px] inline-flex h-[38px] cursor-pointer items-center gap-2 rounded-full border-none bg-[var(--po-ink)] px-4 text-[13px] font-medium text-[var(--po-panel)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
          >
            <Plus size={15} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
