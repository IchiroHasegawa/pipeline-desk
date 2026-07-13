import { createClient } from "@/lib/supabase/client";

export async function test() {
  const supabase = createClient();
  supabase.from("projects").insert({
    title: "Test",
    project_code: "TEST",
    status: "Active"
  });
}
