import { Schema } from "mongoose";

/**
 * Shared field definitions for models ported from the Postgres schema.
 *
 * `_id` stays a UUID **string** rather than an ObjectId: the seed data
 * cross-references fixed uuids (e.g. 20000000-0000-4000-8000-000000000001),
 * so converting would mean rewriting every seed reference.
 */
export const uuidPk = {
  type: String,
  required: true,
  default: () => crypto.randomUUID(),
} as const;

/** CHECK (status IN ('Active','Retired')) — projects, episodes and scenes. */
export const LIFECYCLE_STATUSES = ["Active", "Retired"] as const;

export const lifecycleStatus = {
  type: String,
  required: true,
  enum: LIFECYCLE_STATUSES,
  default: "Active",
} as const;

/** Postgres `date` columns; stored as Date, no time component intended. */
export const dateOnly = { type: Date } as const;

/**
 * A reference to another collection, stored as the target's UUID string.
 *
 * `indexed` defaults to true because refs are nearly always queried. Pass
 * `false` when the field also carries its own `schema.index(...)`: a
 * single-field explicit index auto-generates the same name as the implicit one
 * (`projectId_1`), and Mongo rejects two indexes sharing a name but differing
 * in options.
 */
export function refTo(model: string, required = false, indexed = true) {
  return { type: String, required, ref: model, index: indexed } as const;
}

export const timestamped: { timestamps: true } = { timestamps: true };

export type WithStringId = { _id: string };

export const jsonObject = {
  type: Schema.Types.Mixed,
  required: true,
  default: () => ({}),
} as const;
