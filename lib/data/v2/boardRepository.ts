import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BoardElement } from "@/types/production-v2";

function formatPostgrestError(
  context: string,
  error: { code?: string; message: string; details?: string | null; hint?: string | null }
): Error {
  return new Error(
    `${context} failed [${error.code ?? "UNKNOWN"}]: ${error.message}` +
      (error.details ? ` | details: ${error.details}` : "") +
      (error.hint ? ` | hint: ${error.hint}` : "")
  );
}

export function mapBoardElement(row: {
  id: string;
  board_id: string;
  element_type: string;
  parent_folder_id?: string | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  z_index?: number | null;
  title?: string | null;
  body?: string | null;
  colour?: string | null;
  asset_id?: string | null;
  asset_file_id?: string | null;
  image_url?: string | null;
  keyframe_number?: number | null;
  from_element_id?: string | null;
  to_element_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}): BoardElement {
  return {
    id: row.id,
    boardId: row.board_id,
    elementType: row.element_type as BoardElement["elementType"],
    parentFolderId: row.parent_folder_id || null,
    x: Number(row.x || 0),
    y: Number(row.y || 0),
    width: Number(row.width || 100),
    height: Number(row.height || 100),
    zIndex: Number(row.z_index || 0),
    title: row.title || null,
    body: row.body || null,
    colour: row.colour || null,
    assetId: row.asset_id || null,
    assetFileId: row.asset_file_id || null,
    imageUrl: row.image_url || null,
    keyframeNumber: row.keyframe_number ?? null,
    fromElementId: row.from_element_id || null,
    toElementId: row.to_element_id || null,
    createdBy: row.created_by || "",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function getOrCreateBoard(
  scope: { sceneId: string } | { projectId: string }
): Promise<string> {
  const supabase = await createClient();
  const params =
    "sceneId" in scope
      ? { p_scene_id: scope.sceneId }
      : { p_project_id: scope.projectId };

  const { data, error } = await supabase.rpc("get_or_create_board", params);

  if (error) {
    throw formatPostgrestError("getOrCreateBoard", error);
  }

  if (!data) {
    throw new Error("getOrCreateBoard failed: RPC returned null or empty board ID.");
  }

  return data;
}

export async function getBoardElements(boardId: string): Promise<BoardElement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("board_elements")
    .select("*")
    .eq("board_id", boardId)
    .order("z_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw formatPostgrestError("getBoardElements", error);
  }

  return (data || []).map(mapBoardElement);
}

export async function getKeyframesForSceneBoard(sceneId: string): Promise<BoardElement[]> {
  const boardId = await getOrCreateBoard({ sceneId });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("board_elements")
    .select("*")
    .eq("board_id", boardId)
    .eq("element_type", "keyframe")
    .order("keyframe_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw formatPostgrestError("getKeyframesForSceneBoard", error);
  }

  return (data || []).map(mapBoardElement);
}
