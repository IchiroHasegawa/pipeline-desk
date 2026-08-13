import React from "react";

export default function AssetsAssemblyLoading() {
  return (
    <div className="flex h-screen w-screen bg-[var(--color-canvas,#ffffff)] font-sans select-none overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="w-[330px] h-full pt-[120px] px-6 pb-6 border-r border-[var(--color-line-soft,#a9a9a9)] bg-[var(--color-selection,#d9d9d9)] flex flex-col gap-6">
        <div className="w-32 h-8 bg-black/10 rounded animate-pulse" />
        <div className="flex flex-col gap-4">
          <div className="w-[202px] h-[282px] rounded-lg bg-black/10 animate-pulse" />
          <div className="w-[202px] h-[282px] rounded-lg bg-black/10 animate-pulse" />
        </div>
      </div>
      {/* Main Board Canvas skeleton */}
      <div className="flex-1 h-full flex items-center justify-center bg-[#eaeaea]">
        <div className="flex flex-col items-center gap-2 text-xs font-mono text-[var(--color-ink-muted,#707070)]">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span>Loading Assembly Board...</span>
        </div>
      </div>
    </div>
  );
}
