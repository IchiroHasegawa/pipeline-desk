import React from "react";

export interface PageHeaderProps {
  title: string;
  count?: string | number;
  subtitle?: string;
  right?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  count,
  subtitle,
  right,
}) => {
  return (
    <div className="flex min-h-[40px] items-center justify-between gap-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="m-0 whitespace-nowrap text-[30px] font-semibold tracking-[-0.025em] text-[var(--po-ink)]">
          {title}
        </h1>
        {count !== undefined && count !== null && count !== "" && (
          <span className="rounded-full bg-[var(--po-chip)] px-[9px] py-[3px] text-[12px] font-semibold text-[var(--po-ink-2)]">
            {count}
          </span>
        )}
        {subtitle && (
          <span className="truncate whitespace-nowrap pl-1 text-[13px] text-[var(--po-ink-3)]">
            {subtitle}
          </span>
        )}
      </div>

      {right && (
        <div className="flex flex-none items-center gap-[10px]">
          {right}
        </div>
      )}
    </div>
  );
};
