"use client";

import React, { useEffect } from "react";
import { Monitor } from "lucide-react";
import { ActionRail, type RailAction } from "@/components/app-shell/ActionRail";
import { AvatarMenu } from "@/components/app-shell/AvatarMenu";
import { Breadcrumb, type BreadcrumbItem } from "@/components/app-shell/Breadcrumb";

export interface AssemblyLayoutProps {
  // Rail actions
  railActions: readonly RailAction[];
  bottomActions: readonly RailAction[];
  railLabel?: string;

  // Header / Top Bar
  breadcrumb?: readonly BreadcrumbItem[];
  title: string;
  subtitle?: string;
  topBarRight?: React.ReactNode;
  isTopBarHidden: boolean;

  // Side Panel
  sidePanel?: React.ReactNode;
  isSidePanelHidden: boolean;

  // Bottom Overlays
  summary?: React.ReactNode;
  toolbar?: React.ReactNode;
  zoomControls?: React.ReactNode;

  // Fixed Background Canvas
  children: React.ReactNode;
}

export const AssemblyLayout: React.FC<AssemblyLayoutProps> = ({
  railActions,
  bottomActions,
  railLabel,
  breadcrumb,
  title,
  subtitle,
  topBarRight,
  isTopBarHidden,
  sidePanel,
  isSidePanelHidden,
  summary,
  toolbar,
  zoomControls,
  children,
}) => {
  // Lock html and body overflow while mounted on assembly pages
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 h-screen w-screen overflow-hidden bg-[var(--po-bg)] text-[14px] text-[var(--po-ink)] select-none"
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

      {/* Background Canvas (Fixed Edge-to-Edge) */}
      <div className="fixed inset-0 z-0 overflow-hidden">{children}</div>

      {/* Floating HUD Overlays (Pass-through container) */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {/* Left Action Rail */}
        <div className="pointer-events-auto fixed bottom-4 left-4 top-4 z-50">
          <ActionRail
            actions={railActions}
            bottomActions={bottomActions}
            railLabel={railLabel}
          />
        </div>

        {/* Floating Top Bar */}
        {!isTopBarHidden && (
          <header className="pointer-events-auto absolute left-[88px] top-4 z-40 flex max-w-[calc(100%-200px)] flex-col gap-1 rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] px-4 py-2.5 shadow-[var(--po-shadow)] transition-all">
            {breadcrumb && <Breadcrumb items={breadcrumb} />}
            <div className="flex items-center gap-3 pl-1">
              <span className="whitespace-nowrap text-[20px] font-semibold tracking-[-0.02em] text-[var(--po-ink)]">
                {title}
              </span>
              {subtitle && (
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[var(--po-ink-3)]">
                  {subtitle}
                </span>
              )}
              {topBarRight && <div className="ml-auto pl-4">{topBarRight}</div>}
            </div>
          </header>
        )}

        {/* Floating Side Panel */}
        {!isSidePanelHidden && sidePanel && (
          <aside
            style={{
              top: isTopBarHidden ? "16px" : "108px",
            }}
            className="pointer-events-auto absolute bottom-4 left-[88px] z-40 flex w-[300px] flex-col overflow-hidden rounded-[22px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow)] transition-[top] duration-200 ease-in-out"
          >
            {sidePanel}
          </aside>
        )}

        {/* Bottom-Left Summary Badge */}
        {summary && (
          <div
            style={{
              left: isSidePanelHidden ? "88px" : "404px",
            }}
            className="pointer-events-auto absolute bottom-4 z-40 flex h-[46px] items-center gap-2.5 whitespace-nowrap rounded-full border border-[var(--po-line)] bg-[var(--po-card)] px-4 text-[12px] font-medium text-[var(--po-ink-2)] shadow-[var(--po-shadow)] transition-[left] duration-200 ease-in-out select-none"
          >
            {summary}
          </div>
        )}

        {/* Bottom-Centre Toolbar */}
        {toolbar && (
          <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
            {toolbar}
          </div>
        )}

        {/* Bottom-Right Zoom Controls */}
        {zoomControls && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-40">
            {zoomControls}
          </div>
        )}

        {/* Top-Right Avatar */}
        <div className="pointer-events-auto fixed right-4 top-4 z-50">
          <AvatarMenu className="!right-4 !top-4" />
        </div>
      </div>
    </div>
  );
};
