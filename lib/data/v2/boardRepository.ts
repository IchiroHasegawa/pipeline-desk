import { createClient } from "@/lib/supabase/client";
import type { BoardElement, CreateElementInput } from "@/types/production-v2";
import type { Database } from "@/types/supabase";

type BoardElementInsert = Database["public"]["Tables"]["board_elements"]["Insert"];
type BoardElementUpdate = Database["public"]["Tables"]["board_elements"]["Update"];

export function mapBoardElement(row: {
  id: string;
  board_id: string;
  element_type: string;
  parent_folder_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  title: string | null;
  body: string | null;
  colour: string | null;
  asset_id: string | null;
  asset_file_id: string | null;
  image_url: string | null;
  keyframe_number: number | null;
  from_element_id: string | null;
  to_element_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}): BoardElement {
  return {
    id: row.id,
    boardId: row.board_id,
    elementType: row.element_type as BoardElement["elementType"],
    parentFolderId: row.parent_folder_id,
    x: Number(row.x),
    y: Number(row.y),
    width: Number(row.width),
    height: Number(row.height),
    zIndex: row.z_index,
    title: row.title,
    body: row.body,
    colour: row.colour,
    assetId: row.asset_id,
    assetFileId: row.asset_file_id,
    imageUrl: row.image_url,
    keyframeNumber: row.keyframe_number,
    fromElementId: row.from_element_id,
    toElementId: row.to_element_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrCreateBoard(
  scope: { sceneId: string } | { projectId: string }
): Promise<string> {
  try {
    const supabase = createClient();
    const params =
      "sceneId" in scope
        ? { p_scene_id: scope.sceneId }
        : { p_project_id: scope.projectId };

    const { data, error } = await supabase.rpc("get_or_create_board", params);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("RPC get_or_create_board returned null");
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to resolve board for scope: ${message}`);
  }
}

export async function getBoardElements(boardId: string): Promise<BoardElement[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("board_elements")
      .select("*")
      .eq("board_id", boardId)
      .order("z_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapBoardElement);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch board elements for board ${boardId}: ${message}`);
  }
}

export async function createElement(
  input: CreateElementInput,
  isRetry = false
): Promise<BoardElement> {
  try {
    const supabase = createClient();

    let defaultWidth = input.width;
    let defaultHeight = input.height;

    if (!defaultWidth || !defaultHeight) {
      switch (input.elementType) {
        case "folder":
          defaultWidth = 203;
          defaultHeight = 160;
          break;
        case "comment":
          defaultWidth = 168;
          defaultHeight = 28;
          break;
        case "keyframe":
        case "asset":
          defaultWidth = 339;
          defaultHeight = 198;
          break;
        default:
          defaultWidth = 100;
          defaultHeight = 100;
          break;
      }
    }

    const payload: BoardElementInsert = {
      board_id: input.boardId,
      element_type: input.elementType,
      parent_folder_id: input.parentFolderId || null,
      x: input.x,
      y: input.y,
      width: defaultWidth,
      height: defaultHeight,
      z_index: input.zIndex ?? 0,
      title: input.title || null,
      body: input.body || null,
      colour: input.colour || null,
      asset_id: input.assetId || null,
      asset_file_id: input.assetFileId || null,
      image_url: input.imageUrl || null,
      from_element_id: input.fromElementId || null,
      to_element_id: input.toElementId || null,
    };

    const { data, error } = await supabase
      .from("board_elements")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505" && !isRetry) {
        console.warn("Keyframe number collision 23505 detected. Retrying creation once...");
        return createElement(input, true);
      }
      throw error;
    }

    return mapBoardElement(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create board element: ${message}`);
  }
}

export async function updateElement(
  id: string,
  updates: Partial<BoardElement>
): Promise<void> {
  try {
    const supabase = createClient();
    const payload: BoardElementUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (updates.x !== undefined) payload.x = updates.x;
    if (updates.y !== undefined) payload.y = updates.y;
    if (updates.width !== undefined) payload.width = updates.width;
    if (updates.height !== undefined) payload.height = updates.height;
    if (updates.zIndex !== undefined) payload.z_index = updates.zIndex;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.body !== undefined) payload.body = updates.body;
    if (updates.colour !== undefined) payload.colour = updates.colour;
    if (updates.parentFolderId !== undefined) payload.parent_folder_id = updates.parentFolderId;

    const { error } = await supabase
      .from("board_elements")
      .update(payload)
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update board element ${id}: ${message}`);
  }
}

export async function moveElements(
  moves: Array<{ id: string; x: number; y: number; zIndex?: number }>
): Promise<void> {
  if (moves.length === 0) return;
  try {
    const supabase = createClient();
    const nowStr = new Date().toISOString();

    const rows = moves.map((m) => ({
      id: m.id,
      x: m.x,
      y: m.y,
      ...(m.zIndex !== undefined ? { z_index: m.zIndex } : {}),
      updated_at: nowStr,
    }));

    const { error } = await supabase
      .from("board_elements")
      .upsert(rows as unknown as BoardElementInsert[], { onConflict: "id" });

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to move elements: ${message}`);
  }
}

export async function deleteElement(id: string): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("board_elements").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete board element ${id}: ${message}`);
  }
}

export async function setElementFolder(
  id: string,
  folderId: string | null
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("board_elements")
      .update({ parent_folder_id: folderId, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to set folder for element ${id}: ${message}`);
  }
}

export async function getKeyframesForSceneBoard(sceneId: string): Promise<BoardElement[]> {
  try {
    const boardId = await getOrCreateBoard({ sceneId });
    const supabase = createClient();

    const { data, error } = await supabase
      .from("board_elements")
      .select("*")
      .eq("board_id", boardId)
      .eq("element_type", "keyframe")
      .order("keyframe_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapBoardElement);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch keyframes for scene ${sceneId}: ${message}`);
  }
}
