import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVER_URL } from "@/lib/supabase/server-url";

export function getAdminClient() {
  const supabaseUrl = SUPABASE_SERVER_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Required for privileged operations.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}
