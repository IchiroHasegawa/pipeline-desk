import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type DeploymentMode = "local" | "staging" | "production";

export function getDeploymentMode(): DeploymentMode {
  const mode = process.env.PRODUCTION_OS_DEPLOYMENT_MODE;
  if (mode === "local" || mode === "staging" || mode === "production") {
    return mode;
  }
  
  if (process.env.NODE_ENV !== "production") {
    return "local";
  }
  
  return "production";
}

export async function generateStagingToken(code: string): Promise<string> {
  const secret = process.env.PRODUCTION_OS_TEST_ACCESS_CODE || "default-staging-secret";
  
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(secret);
  const data = encoder.encode(code);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyStagingAccess(request?: NextRequest): Promise<boolean> {
  const cookieName = "production_os_staging_access";
  let cookieValue: string | undefined;

  if (request) {
    cookieValue = request.cookies.get(cookieName)?.value;
  } else {
    const cookieStore = await cookies();
    cookieValue = cookieStore.get(cookieName)?.value;
  }

  if (!cookieValue) return false;

  const expectedCode = process.env.PRODUCTION_OS_TEST_ACCESS_CODE;
  if (!expectedCode) return false;

  const expectedToken = await generateStagingToken(expectedCode);
  
  return cookieValue === expectedToken;
}

export async function checkDriveAccess(): Promise<{ allowed: boolean; error?: string }> {
  // 1. Enforce Authentication and Active Profile (Required for all modes to match production behavior)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { allowed: false, error: "Unauthorized: Missing or invalid authentication session." };
  }

  const { data } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', user.id)
    .single();

  const profile = data as unknown as { account_status: string } | null;

  if (profile?.account_status !== 'active') {
    return { allowed: false, error: "Unauthorized: Production OS account is unavailable." };
  }

  // 2. Check deployment mode specific rules
  const mode = getDeploymentMode();
  const isTestAccessEnabled = process.env.PRODUCTION_OS_TEST_ACCESS_ENABLED === "true";
  
  if (mode === "local" || mode === "production") {
    // If authenticated and active, allow.
    return { allowed: true };
  }
  
  if (mode === "staging") {
    if (isTestAccessEnabled) {
      const isAuthorized = await verifyStagingAccess();
      if (!isAuthorized) {
        return { allowed: false, error: "Unauthorized staging access for Google Drive operations." };
      }
    }
    return { allowed: true };
  }
  
  return { allowed: false, error: "Unknown deployment mode." };
}
