"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BoardElement, CreateElementInput } from "@/types/production-v2";
import type { Database } from "@/types/supabase";

type BoardElementInsert = Database["public"]["Tables"]["board_elements"]["Insert"];
type BoardElementUpdate = Database["public"]["Tables"]["board_elements"]["Update"];

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

function mapBoardElement(row: {
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

export async function createElement(
  input: CreateElementInput,
  isRetry = false
): Promise<BoardElement> {
  const supabase = await createClient();

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
    throw formatPostgrestError("createElement", error);
  }

  if (!data) {
    throw new Error("createElement failed: No data returned from board element insert.");
  }

  revalidatePath("/projects", "layout");
  revalidatePath("/assets/assembly", "layout");

  return mapBoardElement(data);
}

export async function updateElement(
  id: string,
  updates: Partial<BoardElement>
): Promise<void> {
  const supabase = await createClient();
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
    throw formatPostgrestError("updateElement", error);
  }

  revalidatePath("/projects", "layout");
  revalidatePath("/assets/assembly", "layout");
}

export async function moveElements(
  moves: Array<{ id: string; x: number; y: number; zIndex?: number }>
): Promise<void> {
  if (moves.length === 0) return;
  const supabase = await createClient();
  const nowStr = new Date().toISOString();

  await Promise.all(
    moves.map(async (m) => {
      const payload: BoardElementUpdate = {
        x: m.x,
        y: m.y,
        updated_at: nowStr,
      };
      if (m.zIndex !== undefined) payload.z_index = m.zIndex;

      const { error } = await supabase
        .from("board_elements")
        .update(payload)
        .eq("id", m.id);

      if (error) {
        throw formatPostgrestError("moveElements", error);
      }
    })
  );

  revalidatePath("/projects", "layout");
  revalidatePath("/assets/assembly", "layout");
}

export async function deleteElement(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("board_elements").delete().eq("id", id);

  if (error) {
    throw formatPostgrestError("deleteElement", error);
  }

  revalidatePath("/projects", "layout");
  revalidatePath("/assets/assembly", "layout");
}

export async function setElementFolder(
  id: string,
  folderId: string | null
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_elements")
    .update({ parent_folder_id: folderId, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw formatPostgrestError("setElementFolder", error);
  }

  revalidatePath("/projects", "layout");
  revalidatePath("/assets/assembly", "layout");
}

export async function createBoardAssetElement(input: {
  boardId: string;
  projectId?: string | null;
  filename: string;
  imageUrl?: string | null;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex?: number;
}): Promise<{ element: BoardElement; hasDefaultWorkflow: boolean }> {
  const supabase = await createClient();
  let targetProjectId = input.projectId || null;

  if (!targetProjectId && input.boardId) {
    const { data: boardRow } = await supabase
      .from("boards")
      .select("project_id")
      .eq("id", input.boardId)
      .single();
    if (boardRow?.project_id) {
      targetProjectId = boardRow.project_id;
    }
  }

  const { createAssetWithDefaults } = await import("@/app/actions/production");

  // Step a & c: insert into assets and asset_project_links
  const asset = await createAssetWithDefaults({
    filename: input.filename,
    projectId: targetProjectId,
    imageUrl: input.imageUrl,
  });

  // Step b: insert into board_elements with element_type='asset' AND asset_id set
  try {
    const element = await createElement({
      boardId: input.boardId,
      elementType: "asset",
      assetId: asset.id,
      title: asset.name,
      imageUrl: input.imageUrl || null,
      x: input.x,
      y: input.y,
      width: input.width || 339,
      height: input.height || 198,
      zIndex: input.zIndex ?? 0,
    });

    return { element, hasDefaultWorkflow: Boolean(asset.hasDefaultWorkflow) };
  } catch (err) {
    // Atomic rollback: Delete asset and link row if board element insertion fails
    await supabase.from("asset_project_links").delete().eq("asset_id", asset.id);
    await supabase.from("assets").delete().eq("id", asset.id);
    throw err;
  }
}

export async function assignBoardElementsToProject(
  elementIds: string[],
  targetProjectId: string
): Promise<{ success: boolean; movedIds: string[] }> {
  if (elementIds.length === 0) return { success: true, movedIds: [] };
  const supabase = await createClient();
  const { getOrCreateBoard } = await import("@/lib/data/v2/boardRepository");

  const { data: elements, error: fetchError } = await supabase
    .from("board_elements")
    .select("id, element_type, asset_id")
    .in("id", elementIds);

  if (fetchError) {
    throw formatPostgrestError("assignBoardElementsToProject (elements fetch)", fetchError);
  }

  const keyframeEl = (elements || []).find((e) => e.element_type === "keyframe");
  if (keyframeEl) {
    throw new Error("Keyframes belong to a scene and cannot be assigned to a project");
  }

  const targetBoardId = await getOrCreateBoard({ projectId: targetProjectId });

  const movedIds: string[] = [];
  for (const el of elements || []) {
    if (el.asset_id) {
      const { error: delLinkError } = await supabase
        .from("asset_project_links")
        .delete()
        .eq("asset_id", el.asset_id);
      if (delLinkError) {
        throw formatPostgrestError("assignBoardElementsToProject (delete old links)", delLinkError);
      }

      const { error: insLinkError } = await supabase
        .from("asset_project_links")
        .insert([{ asset_id: el.asset_id, project_id: targetProjectId }]);
      if (insLinkError) {
        throw formatPostgrestError("assignBoardElementsToProject (insert new link)", insLinkError);
      }
    }

    const { error: updateElError } = await supabase
      .from("board_elements")
      .update({ board_id: targetBoardId, updated_at: new Date().toISOString() })
      .eq("id", el.id);

    if (updateElError) {
      throw formatPostgrestError("assignBoardElementsToProject (move element)", updateElError);
    }

    movedIds.push(el.id);
  }

  revalidatePath("/assets/assembly", "layout");
  revalidatePath("/assets/manage", "layout");

  return { success: true, movedIds };
}

export async function assignBoardElementsToEpisode(
  elementIds: string[],
  targetEpisodeId: string,
  targetProjectId: string
): Promise<{ success: boolean; movedIds: string[] }> {
  if (elementIds.length === 0) return { success: true, movedIds: [] };
  const supabase = await createClient();
  const { getOrCreateBoard } = await import("@/lib/data/v2/boardRepository");

  const { data: elements, error: fetchError } = await supabase
    .from("board_elements")
    .select("id, element_type, asset_id")
    .in("id", elementIds);

  if (fetchError) {
    throw formatPostgrestError("assignBoardElementsToEpisode (elements fetch)", fetchError);
  }

  const keyframeEl = (elements || []).find((e) => e.element_type === "keyframe");
  if (keyframeEl) {
    throw new Error("Keyframes belong to a scene and cannot be assigned to a project");
  }

  const targetBoardId = await getOrCreateBoard({ projectId: targetProjectId });

  const movedIds: string[] = [];
  for (const el of elements || []) {
    if (el.asset_id) {
      const { data: existingJobLink } = await supabase
        .from("asset_job_links")
        .select("id")
        .eq("asset_id", el.asset_id)
        .eq("episode_id", targetEpisodeId)
        .limit(1)
        .maybeSingle();

      if (!existingJobLink) {
        const { error: insJobError } = await supabase
          .from("asset_job_links")
          .insert([{ asset_id: el.asset_id, episode_id: targetEpisodeId }]);
        if (insJobError) {
          throw formatPostgrestError("assignBoardElementsToEpisode (insert job link)", insJobError);
        }
      }

      const { data: existingProjLink } = await supabase
        .from("asset_project_links")
        .select("id")
        .eq("asset_id", el.asset_id)
        .eq("project_id", targetProjectId)
        .limit(1)
        .maybeSingle();

      if (!existingProjLink) {
        const { error: insProjError } = await supabase
          .from("asset_project_links")
          .insert([{ asset_id: el.asset_id, project_id: targetProjectId }]);
        if (insProjError) {
          throw formatPostgrestError("assignBoardElementsToEpisode (insert project link)", insProjError);
        }
      }
    }

    const { error: updateElError } = await supabase
      .from("board_elements")
      .update({ board_id: targetBoardId, updated_at: new Date().toISOString() })
      .eq("id", el.id);

    if (updateElError) {
      throw formatPostgrestError("assignBoardElementsToEpisode (move element)", updateElError);
    }

    movedIds.push(el.id);
  }

  revalidatePath("/assets/assembly", "layout");
  revalidatePath("/assets/manage", "layout");

  return { success: true, movedIds };
}
