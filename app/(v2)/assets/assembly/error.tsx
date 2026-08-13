"use client";

import React, { useEffect } from "react";

export default function AssetsAssemblyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Assets Assembly Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--color-canvas,#ffffff)] font-sans text-xs p-6 select-none">
      <div className="flex flex-col gap-4 max-w-md border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] p-6 bg-red-50 text-red-900 shadow-md">
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-base text-red-800">Assembly Board Error</h2>
          <p className="text-xs text-red-700">
            {error?.message || "An unexpected error occurred while loading the Assembly board."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="px-3 py-1.5 bg-red-800 text-white font-bold text-xs rounded hover:bg-red-900 transition-colors"
          >
            Retry
          </button>
          <a
            href="/assets/assembly"
            className="px-3 py-1.5 bg-white text-red-800 border border-red-300 font-bold text-xs rounded hover:bg-red-100 transition-colors"
          >
            Reload Inbox
          </a>
        </div>
      </div>
    </div>
  );
}
