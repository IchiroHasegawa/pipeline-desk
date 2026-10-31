import crypto from "node:crypto";
import { Board, type BoardDoc } from "@/lib/models/Board";
import { requireActiveUser, type Actor } from "@/lib/permissions";

/** A board belongs to exactly one project or one scene, never both. */
export type BoardRef = { projectId: string; sceneId?: never } | { sceneId: string; projectId?: never };

/**
 * Ports `get_or_create_board`.
 *
 * Implemented as a single idempotent **upsert** rather than read-then-insert.
 * Two people opening the same board at once would both read "absent" and both
 * insert; the partial unique index (`boards_project_uniq` /
 * `boards_scene_uniq`) would then turn the loser into a duplicate-key error
 * surfaced as a broken page.
 *
 * `$setOnInsert` carries the id so an insert and a hit return the same shape
 * without a second round trip.
 */
export async function getOrCreateBoard(actor: Actor, ref: BoardRef): Promise<BoardDoc> {
  requireActiveUser(actor);

  const scopes = [ref?.projectId, ref?.sceneId].filter(
    (v) => v !== undefined && v !== null
  );
  if (scopes.length !== 1) {
    throw new Error("A board reference must name exactly one of projectId or sceneId.");
  }

  const filter = ref.projectId ? { projectId: ref.projectId } : { sceneId: ref.sceneId };

  const board = await Board.findOneAndUpdate(
    filter,
    { $setOnInsert: { _id: crypto.randomUUID(), ...filter } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  )
    .lean<BoardDoc>()
    .exec();

  return board as BoardDoc;
}
