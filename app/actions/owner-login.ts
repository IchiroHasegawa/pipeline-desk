"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export type OwnerAuthState = {
  success?: boolean;
  message?: string;
  step?: number;
  username?: string;
};

export async function ownerLoginStep1Action(prevState: OwnerAuthState | null, formData: FormData): Promise<OwnerAuthState> {
  const username = formData.get("username")?.toString();

  if (!username) return { message: "Owner credentials could not be verified.", step: 1 };
  
  // We simply move to step 2 to avoid enumeration.
  return { success: true, step: 2, username };
}

export async function ownerLoginStep2Action(prevState: OwnerAuthState | null, formData: FormData): Promise<OwnerAuthState> {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { message: "Owner credentials could not be verified.", step: 2, username };
  }

  try {
    const adminClient = getAdminClient();
    
    // Securely lookup the profile
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, account_status, system_role")
      .ilike("username", username)
      .maybeSingle();

    // Do NOT reveal specific reasons
    if (profileError || !profile || profile.account_status !== "active" || profile.system_role !== "owner") {
      return { message: "Owner credentials could not be verified.", step: 2, username };
    }
    
    // Retrieve the email
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(profile.id);
    
    if (userError || !userData?.user?.email) {
      return { message: "Owner credentials could not be verified.", step: 2, username };
    }

    // Now sign in using standard SSR client to establish AAL1
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    if (authError) {
      return { message: "Owner credentials could not be verified.", step: 2, username };
    }

    // Successfully logged in at AAL1, now client must handle Step 3 (MFA)
    return { success: true, step: 3, username };

  } catch (error) {
    console.error("Owner Login error:", error);
    return { message: "Owner credentials could not be verified.", step: 2, username };
  }
}
