"use client";

import { useState } from "react";
import type { Asset } from "@/types/production";
import ProgressCircle from "@/components/production/ProgressCircle";

type AssetDetailsPanelProps = {
  asset: Asset;
};

export default function AssetDetailsPanel({ asset }: AssetDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"details" | "notes">("details");

  const totalTasks = asset.tasks?.length || 0;
  const completedTasks = asset.tasks?.filter((t) => t.status === "Approved").length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-[#2a2a2a] bg-zinc-900 lg:flex">
      {asset.previewUrl ? (
        <div
          aria-label={`${asset.assetName} preview`}
          className="aspect-video w-full bg-zinc-800 bg-cover bg-center"
          style={{ backgroundImage: `url(${asset.previewUrl})` }}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-zinc-800 text-sm font-bold text-zinc-500">
          No Preview Available
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded border border-[#2a2a2a] p-2">
            <h2 className="text-sm font-bold truncate" title={asset.assetName}>
              {asset.assetName}
            </h2>
            <ProgressCircle value={progress} size={32} />
          </div>

          <div className="flex border-b border-[#2a2a2a]">
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-2 text-xs transition-colors ${
                activeTab === "notes"
                  ? "rounded-t bg-white font-bold text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 text-xs transition-colors ${
                activeTab === "details"
                  ? "rounded-t bg-white font-bold text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Details
            </button>
          </div>

          {activeTab === "details" && (
            <>
              <div className="space-y-3 rounded border border-[#2a2a2a] p-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Asset Name</label>
                  <input
                    type="text"
                    value={asset.assetName}
                    readOnly
                    className="w-full rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">Description</label>
                  <textarea
                    value={asset.description || ""}
                    readOnly
                    className="h-16 w-full resize-none rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none"
                  />
                </div>
                <DetailRow label="Asset Code" value={asset.assetCode} />
                <DetailRow label="Asset Type" value={asset.assetType} />
                <DetailRow label="Category" value={asset.category?.name || "Uncategorized"} />
                <DetailRow label="Workflow" value={asset.workflow} />
                <DetailRow label="Priority" value={String(asset.priority)} />
                {asset.tags && asset.tags.length > 0 && (
                  <div className="space-y-0.5 mt-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.tags.map((tag) => (
                        <span key={tag} className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-[#2a2a2a] pt-2">
                <div className="mb-2 border-b border-[#2a2a2a] pb-1">
                  <span className="text-xs font-bold text-zinc-400">File Attachments</span>
                </div>
                <div className="space-y-2 mt-2">
                  {asset.files && asset.files.length > 0 ? (
                    asset.files.map((file) => (
                      <div key={file.id} className="flex justify-between items-center text-xs bg-black p-2 rounded border border-[#2a2a2a]">
                        <span className="truncate max-w-[150px] text-zinc-300" title={file.fileName}>{file.fileName}</span>
                        <span className="text-zinc-500">{file.fileFormat}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-zinc-500 italic">No files attached.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "notes" && (
            <div className="space-y-2">
              {asset.description ? (
                <div className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-300">
                  <p className="mb-1 font-bold text-zinc-500">Asset Notes</p>
                  <p>{asset.description}</p>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">No notes available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500">{label}</span>
      <div className="text-xs text-zinc-400">{value}</div>
    </div>
  );
}
