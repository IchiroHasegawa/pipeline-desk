"use client";

import React from "react";
import { Monitor } from "lucide-react";
import { ActionRail, type RailAction } from "./ActionRail";
import { AvatarMenu } from "./AvatarMenu";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import { PageHeader, type PageHeaderProps } from "./PageHeader";

export interface AppShellProps {
  actions: readonly RailAction[];
  bottomAction?: RailAction;
  railLabel?: string;
  breadcrumb?: readonly BreadcrumbItem[];
  header?: PageHeaderProps;
  contentClassName?: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  actions,
  bottomAction,
  railLabel,
  breadcrumb,
  header,
  contentClassName,
  children,
}) => {
  return (
    <div
      className="relative flex h-screen w-full min-w-0 gap-4 overflow-hidden bg-[var(--po-bg)] p-4 text-[14px] text-[var(--po-ink)]"
      style={{
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
    >
      {/* Desktop-only Width Guard (< 1280px) */}
      <div
        className="fixed inset-0 z-[200] hidden items-center justify-center bg-[var(--po-bg)] p-8 max-[1279px]:flex"
        aria-live="polite"
      >
        <div className="flex max-w-[360px] flex-col items-center gap-[14px] text-center">
          <span className="flex h-[56px] w-[56px] items-center justify-center rounded-[28px] bg-[var(--po-rail)] text-[22px] text-white">
            <Monitor size={22} />
          </span>
          <span className="text-[17px] font-semibold text-[var(--po-ink)]">
            Production OS requires a wider window.
          </span>
          <span className="text-[13px] leading-[1.5] text-[var(--po-ink-2)]">
            Resize to at least 1280px wide to continue.
          </span>
        </div>
      </div>

      {/* Left Action Rail */}
      <ActionRail
        actions={actions}
        bottomAction={bottomAction}
        railLabel={railLabel}
      />

      {/* Main Content Rounded Panel */}
      <main className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-[var(--po-line)] bg-[var(--po-panel)] shadow-[var(--po-shadow)]">
        {/* Top Header Region (Breadcrumb & Page Title/Header) */}
        {(breadcrumb || header) && (
          <header className="flex flex-none flex-col gap-3 pt-[26px] pr-[112px] pb-[20px] pl-[36px]">
            {breadcrumb && <Breadcrumb items={breadcrumb} />}
            {header && <PageHeader {...header} />}
          </header>
        )}

        {/* Content Scroll Container */}
        <section
          className={`flex flex-1 min-h-0 min-w-0 flex-col ${
            contentClassName ?? "overflow-auto px-[36px] pt-1 pb-[36px]"
          }`}
        >
          {children}
        </section>
      </main>

      {/* Top-Right Avatar Menu */}
      <AvatarMenu />
    </div>
  );
};
