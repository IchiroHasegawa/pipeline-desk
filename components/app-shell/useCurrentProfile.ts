"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  username: string;
  display_name: string | null;
  system_role: string;
}

export interface CurrentProfile {
  displayName: string;
  initials: string;
  isOwner: boolean;
  isLoading: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useCurrentProfile(): CurrentProfile {
  const [profile, setProfile] = useState<CurrentProfile>({
    displayName: "User",
    initials: "U",
    isOwner: false,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(): Promise<void> {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) {
            setProfile({
              displayName: "User",
              initials: "U",
              isOwner: false,
              isLoading: false,
            });
          }
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name, system_role")
          .eq("id", user.id)
          .single();

        if (profileError || !data) {
          if (!cancelled) {
            const fallbackName = user.email?.split("@")[0] || "User";
            setProfile({
              displayName: fallbackName,
              initials: getInitials(fallbackName),
              isOwner: false,
              isLoading: false,
            });
          }
          return;
        }

        const profileRecord = data as unknown as ProfileData;
        const name =
          profileRecord.display_name?.trim() ||
          profileRecord.username?.trim() ||
          "User";
        const isOwner = profileRecord.system_role === "owner";

        if (!cancelled) {
          setProfile({
            displayName: name,
            initials: getInitials(name),
            isOwner,
            isLoading: false,
          });
        }
      } catch {
        // Handle unauthenticated state or fetch failures without throwing
        if (!cancelled) {
          setProfile({
            displayName: "User",
            initials: "U",
            isOwner: false,
            isLoading: false,
          });
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}
