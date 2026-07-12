"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Overview", href: "#" },
  { name: "Production", href: "/production" },
  { name: "Open Tasks", href: "#" },
  { name: "Assets", href: "/assets/manage" },
  { name: "Review", href: "#" },
  { name: "Reports", href: "#" },
  { name: "Views", href: "#" },
  { name: "Settings", href: "/settings" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-black px-4 py-2 text-[#e0e0e0]">
      <div className="flex items-center">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-sm font-bold italic text-black">
          P
        </div>
        <span className="ml-2 text-lg font-bold">Production OS</span>
      </div>

      <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.name === "Production" && pathname === "/");
          
          if (item.href === "#") {
            return (
              <button
                key={item.name}
                className={`pb-1 transition-colors text-gray-400 hover:text-white`}
              >
                {item.name}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`pb-1 transition-colors ${
                isActive
                  ? "border-b-2 border-white text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-1 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px]">
            P
          </div>
          <span>PDemo - Admin</span>
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 9l-7 7-7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}
