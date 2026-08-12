"use client";

import React, { useState } from "react";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ListPanel, { ListPanelItem } from "@/components/shell/ListPanel";

export default function ShellPreviewPage() {
  const [selectedId, setSelectedId] = useState<string | null>("ep-01");

  const sampleItems: ListPanelItem[] = [
    { id: "proj-alpha", label: "PROJ_ALPHA" },
    { id: "proj-beta", label: "PROJ_BETA" },
    { id: "ep-01", label: "EP_01" },
    { id: "ep-02", label: "EP_02" },
    { id: "ep-03", label: "EP_03" },
    { id: "sc-010", label: "SC_010" },
    { id: "sc-020", label: "SC_020" },
    { id: "sc-030", label: "SC_030" },
  ];

  const sampleActions: ToolAction[] = [
    { id: "add", label: "ADD", onSelect: () => {} },
    { id: "sub", label: "SUB", onSelect: () => {} },
    { id: "whole", label: "WHOLE", onSelect: () => {} },
    { id: "restore", label: "RESTORE", onSelect: () => {} },
    { id: "hide", label: "HIDE", onSelect: () => {} },
    { id: "sap", label: "SAP", onSelect: () => {} },
  ];

  return (
    <CanvasShell
      nav={<VerticalNav active="assets" activeAssetsSubsection="manage" />}
      tools={<TransformTools actions={sampleActions} />}
      list={
        <ListPanel
          items={sampleItems}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      }
    >
      <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="border border-dashed border-[var(--color-line-soft,#a9a9a9)] p-8 text-center bg-white/50 backdrop-blur-xs rounded-[var(--radius-card,7px)]">
          <p className="text-[var(--text-card-title,17px)] font-sans font-medium text-[var(--color-ink,#000000)] mb-2">
            Production OS Canvas Scaffolding Preview
          </p>
          <p className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-sans">
            Selected list item: <span className="font-mono text-black">{selectedId}</span>
          </p>
        </div>
      </div>
    </CanvasShell>
  );
}
