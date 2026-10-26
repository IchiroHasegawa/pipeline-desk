import type { QueryFilter, Model, SortOrder } from "mongoose";
import { requireActiveUser, type Actor } from "@/lib/permissions";
import { ForbiddenError } from "@/lib/permissions/errors";

export type ListOptions = {
  sort?: Record<string, SortOrder>;
  limit?: number;
  skip?: number;
};

export type BaseRepoOptions<TDoc> = {
  /**
   * Fields a generic create/update may never set.
   *
   * This exists because Postgres' guard is gone. `prevent_system_role_update`
   * silently reverted any client-side write to `system_role`; with no
   * database-level trigger, a generic `updateById` would let any user promote
   * themselves to owner with a crafted patch. Writes to these fields go
   * through a named service (lib/auth/roles.ts, lib/auth/reset.ts) or not at
   * all — and attempting one here throws rather than being quietly dropped,
   * so a mistaken call site is loud.
   */
  immutable?: readonly string[];

  /**
   * A mandatory filter derived from the acting user, ANDed into **every**
   * query this repository makes — the replacement for a per-row RLS policy
   * such as `auth.uid() = id` (profiles) or `user_id = auth.uid()` (todos).
   *
   * This is deliberately structural rather than a check inside each method.
   * Spreading the base repo and overriding only the methods that looked like
   * reads is exactly how `profiles.updateById` and `todos.deleteById` ended up
   * reaching other people's rows: the guard has to live where a newly added
   * method inherits it automatically, not where someone has to remember it.
   *
   * Scoped repositories distinguish missing from forbidden: an id that exists
   * but falls outside the scope raises ForbiddenError, while an id that does
   * not exist at all still reads as absent.
   */
  scope?: (actor: Actor) => QueryFilter<TDoc>;
};

export type BaseRepo<TDoc> = {
  list(actor: Actor, filter?: QueryFilter<TDoc>, options?: ListOptions): Promise<TDoc[]>;
  getById(actor: Actor, id: string): Promise<TDoc | null>;
  getOne(actor: Actor, filter: QueryFilter<TDoc>): Promise<TDoc | null>;
  create(actor: Actor, data: Record<string, unknown>): Promise<TDoc>;
  updateById(actor: Actor, id: string, patch: Record<string, unknown>): Promise<TDoc | null>;
  deleteById(actor: Actor, id: string): Promise<boolean>;
  deleteMany(actor: Actor, filter: QueryFilter<TDoc>): Promise<number>;
  count(actor: Actor, filter?: QueryFilter<TDoc>): Promise<number>;
};

/**
 * The shared half of every repository.
 *
 * Two rules hold throughout, and they are the reason this layer exists rather
 * than models being used directly from route handlers:
 *
 *  1. **Every method takes the acting user first** and runs a permission guard
 *     before touching the database, so "who is asking" can never be implicit.
 *  2. **Reads return `.lean()` plain objects**, so nothing downstream depends
 *     on Mongoose instance methods and everything serialises straight to a
 *     client component.
 */
export function baseRepo<TDoc>(
  model: Model<TDoc>,
  options: BaseRepoOptions<TDoc> = {}
): BaseRepo<TDoc> {
  const immutable = options.immutable ?? [];

  function rejectImmutable(data: Record<string, unknown>): void {
    const offending = immutable.filter((field) => field in data);
    if (offending.length > 0) {
      throw new Error(
        `Cannot set ${offending.join(", ")} through a repository. ` +
          `Use the dedicated service for this field.`
      );
    }
  }

  /**
   * The caller's filter ANDed with the actor's scope. The scope is spread last
   * so a caller cannot widen it by passing the same key.
   */
  function scoped(actor: Actor, filter: QueryFilter<TDoc> = {}): QueryFilter<TDoc> {
    if (!options.scope) return filter;
    return { ...filter, ...options.scope(actor) } as QueryFilter<TDoc>;
  }

  /**
   * For id-addressed operations on a scoped repository: resolves whether the
   * row is reachable by this actor. Returns "ok" when it is, "missing" when no
   * such row exists at all, and throws ForbiddenError when the row exists but
   * belongs to someone else — so "not found" and "not yours" stay distinct.
   */
  async function reachable(actor: Actor, id: string): Promise<"ok" | "missing"> {
    if (!options.scope) return "ok";

    const inScope = await model
      .findOne(scoped(actor, { _id: id } as QueryFilter<TDoc>))
      .select("_id")
      .lean()
      .exec();
    if (inScope) return "ok";

    const existsAtAll = await model.exists({ _id: id } as QueryFilter<TDoc>);
    if (existsAtAll) {
      throw new ForbiddenError("That record belongs to someone else.");
    }
    return "missing";
  }

  return {
    async list(actor, filter = {}, opts = {}) {
      requireActiveUser(actor);
      let q = model.find(scoped(actor, filter));
      if (opts.sort) q = q.sort(opts.sort);
      if (opts.skip) q = q.skip(opts.skip);
      if (opts.limit) q = q.limit(opts.limit);
      return q.lean<TDoc[]>().exec();
    },

    async getById(actor, id) {
      requireActiveUser(actor);
      if ((await reachable(actor, id)) === "missing") return null;
      return model.findById(id).lean<TDoc>().exec();
    },

    async getOne(actor, filter) {
      requireActiveUser(actor);
      return model.findOne(scoped(actor, filter)).lean<TDoc>().exec();
    },

    async create(actor, data) {
      requireActiveUser(actor);
      rejectImmutable(data);
      // Deliberately loose at this boundary: payloads arrive from route
      // handlers as plain objects, and the Mongoose schema is what validates
      // them at runtime. The cast acknowledges the boundary; it does not skip
      // a check — every model test asserts the schema rejects bad input.
      const created = await model.create(data as Parameters<typeof model.create>[0]);
      // Re-read lean so callers get a plain object and never a document that
      // still holds select:false fields in memory.
      return (await model.findById(created._id).lean<TDoc>().exec()) as TDoc;
    },

    async updateById(actor, id, patch) {
      requireActiveUser(actor);
      rejectImmutable(patch);
      if ((await reachable(actor, id)) === "missing") return null;
      return model
        .findByIdAndUpdate(id, patch, { new: true, runValidators: true })
        .lean<TDoc>()
        .exec();
    },

    async deleteById(actor, id) {
      requireActiveUser(actor);
      if ((await reachable(actor, id)) === "missing") return false;
      const { deletedCount } = await model.deleteOne({ _id: id } as QueryFilter<TDoc>);
      return deletedCount > 0;
    },

    async deleteMany(actor, filter) {
      requireActiveUser(actor);
      const { deletedCount } = await model.deleteMany(scoped(actor, filter));
      return deletedCount;
    },

    async count(actor, filter = {}) {
      requireActiveUser(actor);
      return model.countDocuments(scoped(actor, filter));
    },
  };
}
