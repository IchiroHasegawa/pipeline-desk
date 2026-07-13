"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";

const navItems = [
  { name: "Overview", href: "#" },
  { name: "Production", href: "/production" },
  { name: "Open Tasks", href: "#" },
  { name: "Review", href: "#" },
  { name: "Reports", href: "#" },
  { name: "Views", href: "#" },
  { name: "Settings", href: "/settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const assetsActive = pathname.startsWith("/assets");
  const [username, setUsername] = useState<string>("Loading...");

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();
            
          const profile = data as unknown as { username: string } | null;
          
          if (profile && profile.username) {
            setUsername(profile.username);
          } else {
            setUsername("User");
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }
    loadProfile();
  }, []);

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-black px-4 py-2 text-[#e0e0e0]">
      <div className="flex items-center">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-sm font-bold italic text-black">
          P
        </div>
        <span className="ml-2 text-lg font-bold">Production OS</span>
      </div>

      <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
        {navItems.slice(0, 3).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.name === "Production" && pathname === "/");

          if (item.href === "#") {
            return (
              <button
                key={item.name}
                className="pb-1 text-gray-400 transition-colors hover:text-white"
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

        <div className="group relative pb-1">
          <Link
            href="/assets/manage"
            className={`flex items-center gap-1 transition-colors ${
              assetsActive
                ? "border-b-2 border-white text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Assets
            <ChevronDown className="h-3.5 w-3.5" />
          </Link>

          <div className="invisible absolute left-0 top-full z-50 min-w-36 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <div className="rounded border border-[#2a2a2a] bg-zinc-950 py-1 shadow-xl">
              <Link
                href="/assets/manage"
                className={`block px-3 py-2 text-xs transition-colors ${
                  pathname === "/assets/manage"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                Manage
              </Link>
              <Link
                href="/assets/assembly"
                className={`block px-3 py-2 text-xs transition-colors ${
                  pathname === "/assets/assembly"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                Assembly
              </Link>
            </div>
          </div>
        </div>

        {navItems.slice(3).map((item) => {
          const isActive = pathname === item.href;

          if (item.href === "#") {
            return (
              <button
                key={item.name}
                className="pb-1 text-gray-400 transition-colors hover:text-white"
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
        <div className="group relative">
          <button className="flex items-center space-x-2 rounded border border-[#2a2a2a] bg-zinc-900 px-3 py-1 text-sm hover:bg-zinc-800 transition-colors">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold uppercase">
              {username !== "Loading..." ? username.charAt(0) : "P"}
            </div>
            <span>{username}</span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </button>
          
          <div className="invisible absolute right-0 top-full z-50 min-w-36 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <div className="rounded border border-[#2a2a2a] bg-zinc-950 py-1 shadow-xl">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-zinc-900 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
