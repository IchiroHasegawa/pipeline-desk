"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export type AuthState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  step?: number;
  username?: string;
};

export async function loginAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const step = formData.get("step")?.toString();

  // Step 1: Validate Username exists
  if (step === "1") {
    if (!username) return { message: "Username is required.", step: 1 };
    if (username.length < 3 || username.length > 30) return { message: "Invalid Username or Password.", step: 1 };
    
    return { success: true, step: 2, username };
  }

  // Step 2: Perform actual login
  if (!username || !password) {
    return { message: "Username and password are required.", step: 2, username };
  }

  try {
    const adminClient = getAdminClient();
    
    // Securely lookup the profile ID associated with this username using service_role
    // using ilike to match case-insensitively, even though our unique index helps
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, account_status, system_role")
      .ilike("username", username)
      .maybeSingle();

    if (profileError || !profile) {
      // Return generic error to prevent username enumeration
      return { message: "Invalid Username or Password.", step: 2, username };
    }

    if (profile.account_status !== "active") {
      return { message: "This Production OS account is unavailable.", step: 2, username };
    }
    
    // Retrieve the Auth account email using the server-only Supabase Admin API
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(profile.id);
    
    if (userError || !userData?.user?.email) {
      return { message: "Invalid Username or Password.", step: 2, username };
    }

    // Now sign in using the standard SSR client with the resolved email
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    if (authError) {
      return { message: "Invalid Username or Password.", step: 2, username };
    }

    if (profile.system_role === 'owner') {
      const { data } = await supabase.auth.mfa.listFactors();
      const hasVerifiedFactors = data?.all && data.all.filter(f => f.status === 'verified').length > 0;
      
      if (hasVerifiedFactors) {
        redirect("/owner-login?step=3");
      }
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("Login error:", error);
    return { message: "An unexpected error occurred.", step: 2, username };
  }

  redirect("/production");
}

export async function signupAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const username = formData.get("username")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!username || !email || !password || !confirmPassword) {
    return { message: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { message: "Passwords do not match." };
  }

  if (username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return { message: "Username must be 3-30 characters and contain only letters, numbers, and underscores." };
  }

  try {
    const adminClient = getAdminClient();

    // Check if username already exists to provide a friendly error before auth signup
    const { data: existingUser } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

    if (existingUser) {
      return { message: "That Username is unavailable." };
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // Important: triggers the profile creation in the database
        },
      },
    });

    if (authError) {
      return { message: authError.message };
    }

    // Check if email confirmation is required
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
       return { message: "An account with this email might already exist." };
    }

    if (authData.session) {
      // User is logged in immediately
    } else {
      // Email confirmation required
      return { success: true, message: "Check your email. We sent you a confirmation link." };
    }

  } catch (error) {
    console.error("Signup error:", error);
    return { message: "An unexpected error occurred during signup." };
  }

  redirect("/production");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
