"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import ProjectsSettings from "@/components/settings/ProjectsSettings";
import StorageSettings from "@/components/settings/StorageSettings";

type SettingsCategory = "Projects" | "Users" | "Security" | "Workflows" | "Storage";

const categories: SettingsCategory[] = ["Projects", "Users", "Security", "Workflows", "Storage"];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("Projects");

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0a0a0a] text-[#e0e0e0]">
      <TopNav />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#2a2a2a] bg-zinc-900 p-4">
          <h1 className="mb-6 text-lg font-bold text-white">Settings</h1>
          <nav className="space-y-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-8">
          {activeCategory === "Projects" && <ProjectsSettings />}
          {activeCategory === "Storage" && <StorageSettings />}
          {activeCategory !== "Projects" && activeCategory !== "Storage" && (
            <div className="flex h-full items-center justify-center">
              <div className="rounded border border-[#2a2a2a] bg-zinc-900 px-6 py-4 text-center text-zinc-400">
                <h2 className="mb-2 text-lg font-bold text-white">{activeCategory}</h2>
                <p>Coming Soon</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
