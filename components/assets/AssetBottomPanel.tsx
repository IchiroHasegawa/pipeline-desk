"use client";

import { useState } from "react";
import type { Asset } from "@/types/production";
import TaskCard from "@/components/production/TaskCard";

type AssetBottomPanelProps = {
  asset: Asset;
};

type BottomTab = "tasks" | "environments" | "jobs" | "scenes";

export default function AssetBottomPanel({ asset }: AssetBottomPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("tasks");
  const tasks = asset.tasks || [];

  return (
    <div className="mt-auto shrink-0 border-t border-[#2a2a2a] bg-[#121212] p-4">
      <div className="mb-4 flex gap-6 overflow-x-auto text-xs font-bold uppercase text-zinc-400">
        <button className="rounded-t border border-b-0 border-[#2a2a2a] bg-white px-4 py-1 text-black">
          {asset.assetName}
        </button>
        <TabButton
          label="Tasks"
          active={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
        />
        <TabButton
          label="Environments"
          active={activeTab === "environments"}
          onClick={() => setActiveTab("environments")}
        />
        <TabButton
          label="Jobs"
          active={activeTab === "jobs"}
          onClick={() => setActiveTab("jobs")}
        />
        <TabButton
          label="Scenes"
          active={activeTab === "scenes"}
          onClick={() => setActiveTab("scenes")}
        />
      </div>

      {activeTab === "tasks" && (
        tasks.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} isAssetTask={true} />
            ))}
          </div>
        ) : (
          <EmptyText text="This asset does not have any tasks assigned yet." />
        )
      )}

      {activeTab === "environments" && (
        <EmptyText text="No environment assignments found for this asset." />
      )}

      {activeTab === "jobs" && (
        <EmptyText text="No job assignments found for this asset." />
      )}

      {activeTab === "scenes" && (
        <EmptyText text="No scene assignments found for this asset." />
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-1 transition-colors ${
        active ? "rounded-t bg-white text-black" : "hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyText({ text }: { text: string; }) {
  return <p className="text-xs text-zinc-500">{text}</p>;
}
