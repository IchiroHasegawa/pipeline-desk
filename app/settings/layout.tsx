"use client";

import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import { usePathname } from "next/navigation";

const categories = [
  { name: "Projects", path: "/settings/projects" },
  { name: "Users", path: "/settings/users" },
  { name: "Security", path: "/settings/security" },
  { name: "Workflows", path: "/settings/workflows" },
  { name: "Storage", path: "/settings/storage" }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0a0a0a] text-[#e0e0e0]">
      <TopNav />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#2a2a2a] bg-zinc-900 p-4">
          <h1 className="mb-6 text-lg font-bold text-white">Settings</h1>
          <nav className="space-y-1">
            {categories.map((category) => {
              const isActive = pathname.startsWith(category.path);
              return (
                <Link
                  key={category.name}
                  href={category.path}
                  className={`block w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
