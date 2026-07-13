import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function formatImpact(items: { name: string; code?: string | null }[], type: string) {
  if (!items || items.length === 0) return null;
  const count = items.length;
  const label = count === 1 ? type : type + "s";
  
  // Sort alphabetically by code (or name if no code)
  const sorted = [...items].sort((a, b) => {
    const valA = a.code || a.name;
    const valB = b.code || b.name;
    return valA.localeCompare(valB);
  });

  if (count === 1) {
    const val = sorted[0].code || sorted[0].name;
    return `1 ${label} (${val})`;
  } else {
    const first = sorted[0].code || sorted[0].name;
    const last = sorted[sorted.length - 1].code || sorted[sorted.length - 1].name;
    return `${count} ${label} (${first} to ${last})`;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const id = url.searchParams.get("id");

  if (!entityType || !id) {
    return NextResponse.json({ error: "Missing entityType or id" }, { status: 400 });
  }

  const supabase = await createClient();
  const messages: string[] = [];

  try {
    if (entityType === "Project") {
      // Get Environments
      const { data: envs } = await supabase.from("production_environments").select("id, name").eq("project_id", id);
      if (envs && envs.length > 0) {
        messages.push(formatImpact(envs, "Environment")!);
        
        // Get Episodes
        const envIds = envs.map(e => e.id);
        const { data: episodes } = await supabase.from("episodes").select("id, episode_name, code").in("environment_id", envIds);
        if (episodes && episodes.length > 0) {
          messages.push(formatImpact(episodes.map(e => ({ name: e.episode_name, code: e.code })), "Job")!);
          
          // Get Scenes
          const epIds = episodes.map(e => e.id);
          const { data: scenes } = await supabase.from("scenes").select("id, scene_name").in("episode_id", epIds);
          if (scenes && scenes.length > 0) {
            messages.push(formatImpact(scenes.map(s => ({ name: s.scene_name })), "Scene")!);
          }
        }
      }
    } else if (entityType === "Environment") {
      const { data: episodes } = await supabase.from("episodes").select("id, episode_name, code").eq("environment_id", id);
      if (episodes && episodes.length > 0) {
        messages.push(formatImpact(episodes.map(e => ({ name: e.episode_name, code: e.code })), "Job")!);
        
        const epIds = episodes.map(e => e.id);
        const { data: scenes } = await supabase.from("scenes").select("id, scene_name").in("episode_id", epIds);
        if (scenes && scenes.length > 0) {
          messages.push(formatImpact(scenes.map(s => ({ name: s.scene_name })), "Scene")!);
        }
      }
    } else if (entityType === "Job") {
      const { data: scenes } = await supabase.from("scenes").select("id, scene_name").eq("episode_id", id);
      if (scenes && scenes.length > 0) {
        messages.push(formatImpact(scenes.map(s => ({ name: s.scene_name })), "Scene")!);
      }
    } else if (entityType === "Scene") {
      const { data: tasks } = await supabase.from("production_tasks").select("id, name").eq("scene_id", id);
      if (tasks && tasks.length > 0) {
        messages.push(formatImpact(tasks.map(t => ({ name: t.name })), "Task")!);
      }
    }

    return NextResponse.json({ messages });
  } catch (err: unknown) {
    console.error("Impact sumary error:", err);
    return NextResponse.json({ error: "Failed to load impact" }, { status: 500 });
  }
}
