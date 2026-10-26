import { Board, type BoardDoc } from "@/lib/models/Board";
import { BoardElement, type BoardElementDoc } from "@/lib/models/BoardElement";
import { Todo, type TodoDoc } from "@/lib/models/Todo";
import { baseRepo } from "./base";
import {
  canAccessTodo,
  requireActiveUser,
  ForbiddenError,
  type Actor,
} from "@/lib/permissions";

export const boards = {
  ...baseRepo<BoardDoc>(Board),

  async getForProject(actor: Actor, projectId: string): Promise<BoardDoc | null> {
    requireActiveUser(actor);
    return Board.findOne({ projectId }).lean<BoardDoc>().exec();
  },

  async getForScene(actor: Actor, sceneId: string): Promise<BoardDoc | null> {
    requireActiveUser(actor);
    return Board.findOne({ sceneId }).lean<BoardDoc>().exec();
  },
};

export const boardElements = {
  ...baseRepo<BoardElementDoc>(BoardElement),

  async listForBoard(actor: Actor, boardId: string): Promise<BoardElementDoc[]> {
    requireActiveUser(actor);
    return BoardElement.find({ boardId })
      .sort({ zIndex: 1, createdAt: 1 })
      .lean<BoardElementDoc[]>()
      .exec();
  },

  /**
   * Moving an element is its own method because it is the hot path — a drag
   * writes position far more often than anything else touches an element, and
   * the caller should not have to know which fields that means.
   */
  async move(
    actor: Actor,
    id: string,
    position: { x: number; y: number; zIndex?: number }
  ): Promise<BoardElementDoc | null> {
    requireActiveUser(actor);
    return BoardElement.findByIdAndUpdate(id, position, { new: true, runValidators: true })
      .lean<BoardElementDoc>()
      .exec();
  },

  async nextKeyframeNumber(actor: Actor, boardId: string): Promise<number> {
    requireActiveUser(actor);
    const highest = await BoardElement.findOne({
      boardId,
      elementType: "keyframe",
      keyframeNumber: { $exists: true },
    })
      .sort({ keyframeNumber: -1 })
      .select("keyframeNumber")
      .lean()
      .exec();
    return (highest?.keyframeNumber ?? 0) + 1;
  },
};

/**
 * Todos are the one collection with per-row ownership: RLS was
 * `is_active_user() AND user_id = auth.uid()`. Every method here scopes to the
 * acting user rather than trusting a caller-supplied id, so there is no shape
 * of call that reads someone else's todos.
 */
const todoBase = baseRepo<TodoDoc>(Todo, {
  immutable: ["profileId"],
  // Scoped structurally, so the inherited list/getById/updateById/deleteById
  // are as safe as the explicit *Mine methods. Without this, a call site
  // reaching for the shorter name would silently bypass ownership.
  scope: (actor) => ({ profileId: actor._id }),
});

export const todos = {
  ...todoBase,

  async listMine(actor: Actor, scope?: { sceneId?: string; episodeId?: string }) {
    requireActiveUser(actor);
    return Todo.find({ profileId: actor._id, ...scope })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<TodoDoc[]>()
      .exec();
  },

  async createMine(actor: Actor, data: Record<string, unknown>): Promise<TodoDoc> {
    requireActiveUser(actor);
    // profileId comes from the actor, never from the payload — Postgres got it
    // from auth.uid() and there is no database session to do that now.
    const created = await Todo.create({ ...data, profileId: actor._id });
    return (await Todo.findById(created._id).lean<TodoDoc>().exec()) as TodoDoc;
  },

  async getMine(actor: Actor, id: string): Promise<TodoDoc | null> {
    requireActiveUser(actor);
    const todo = await Todo.findById(id).lean<TodoDoc>().exec();
    if (!todo) return null;
    if (!canAccessTodo(actor, todo)) {
      throw new ForbiddenError("That todo belongs to someone else.");
    }
    return todo;
  },

  async updateMine(
    actor: Actor,
    id: string,
    patch: Record<string, unknown>
  ): Promise<TodoDoc | null> {
    await todos.getMine(actor, id); // throws if it is not theirs
    return todoBase.updateById(actor, id, patch);
  },

  async deleteMine(actor: Actor, id: string): Promise<boolean> {
    await todos.getMine(actor, id);
    return todoBase.deleteById(actor, id);
  },

  async setCompleted(
    actor: Actor,
    id: string,
    completed: boolean
  ): Promise<TodoDoc | null> {
    await todos.getMine(actor, id);
    return Todo.findByIdAndUpdate(
      id,
      completed ? { completedAt: new Date() } : { $unset: { completedAt: 1 } },
      { new: true, runValidators: true }
    )
      .lean<TodoDoc>()
      .exec();
  },
};
