import type { Model } from "mongoose";
import { Project } from "@/lib/models/Project";
import { Episode } from "@/lib/models/Episode";
import { Scene } from "@/lib/models/Scene";
import { SceneNote } from "@/lib/models/SceneNote";
import { AssetCategory } from "@/lib/models/AssetCategory";
import { Workflow } from "@/lib/models/Workflow";
import { WorkflowTaskStatus } from "@/lib/models/WorkflowTaskStatus";
import { WorkflowProcess } from "@/lib/models/WorkflowProcess";
import seedData from "@/docs/mongo-migration/seed-data.json";

/**
 * Seeds the reference and demo data that Postgres migrations 003 / 025 / 026 /
 * 032 created — 84 rows, dominated by the 60 workflow processes.
 *
 * The values live in `docs/mongo-migration/seed-data.json`, extracted from the
 * live database by `scripts/extract-seed-data.sql` rather than transcribed
 * from the migration SQL: a hand-copied value that drifted would be invisible
 * until something downstream behaved oddly.
 *
 * **Idempotent.** Every row is upserted by `_id`, so running it against a
 * partially-seeded database tops it up instead of failing or duplicating, and
 * it is safe to run on every deploy.
 *
 * Insert order matters: workflows precede their processes and statuses, and
 * projects precede episodes precede scenes, so a row never references a parent
 * that does not exist yet.
 */
export type SeedCounts = Record<string, number>;

export type SeedResult = {
  /** Rows present per collection after seeding. */
  counts: SeedCounts;
  /** Rows this run actually created, as opposed to finding already there. */
  inserted: number;
};

type SeedRow = { _id: string } & Record<string, unknown>;

const PLAN: readonly [key: string, model: Model<never>][] = [
  // Parents first.
  ["projects", Project as unknown as Model<never>],
  ["episodes", Episode as unknown as Model<never>],
  ["scenes", Scene as unknown as Model<never>],
  ["sceneNotes", SceneNote as unknown as Model<never>],
  ["assetCategories", AssetCategory as unknown as Model<never>],
  ["workflows", Workflow as unknown as Model<never>],
  ["workflowTaskStatuses", WorkflowTaskStatus as unknown as Model<never>],
  ["workflowProcesses", WorkflowProcess as unknown as Model<never>],
];

/** Drops keys the extractor emitted as null so schema defaults still apply. */
function withoutNulls(row: SeedRow): SeedRow {
  const out: SeedRow = { _id: row._id };
  for (const [k, v] of Object.entries(row)) {
    if (v !== null) out[k] = v;
  }
  return out;
}

export async function seedMongo(): Promise<SeedResult> {
  const data = seedData as unknown as Record<string, SeedRow[]>;
  const counts: SeedCounts = {};
  let inserted = 0;

  for (const [key, model] of PLAN) {
    const rows = data[key] ?? [];

    for (const raw of rows) {
      const row = withoutNulls(raw);
      const { _id, ...fields } = row;
      const result = await model.updateOne(
        { _id } as never,
        { $setOnInsert: fields } as never,
        { upsert: true, setDefaultsOnInsert: true }
      );
      if (result.upsertedCount > 0) inserted += 1;
    }

    counts[key] = await model.countDocuments();
  }

  return { counts, inserted };
}
