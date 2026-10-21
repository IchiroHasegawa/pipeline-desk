import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-[2px] text-[13px]"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span
                aria-hidden="true"
                className="px-[2px] text-[var(--po-ink-3)] opacity-60 select-none"
              >
                /
              </span>
            )}
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="rounded-[6px] px-[6px] py-[3px] text-[var(--po-ink-3)] font-normal transition-colors hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
              >
                {item.label}
              </Link>
            ) : !isLast ? (
              <span className="rounded-[6px] px-[6px] py-[3px] text-[var(--po-ink-3)] font-normal">
                {item.label}
              </span>
            ) : (
              <span
                aria-current="page"
                className="rounded-[6px] px-[6px] py-[3px] font-medium text-[var(--po-ink)]"
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
