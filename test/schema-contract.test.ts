import { describe, it, expect } from "vitest";
import contract from "../docs/mongo-migration/schema-contract.json";

describe("schema contract", () => {
  it("covers every table and view the migration must reproduce", () => {
    expect(Object.keys(contract.tables)).toHaveLength(23);
    expect(contract.views).toEqual(
      expect.arrayContaining([
        "project_commit_days",
        "project_episode_status",
        "project_asset_stats",
      ])
    );
  });

  it("captures the constraint that migration 027 depends on", () => {
    const t = contract.tables.production_tasks;
    expect(t.uniques.join(" ")).toMatch(/uq_production_task_process/);
  });

  it("records profiles.username as NOT NULL", () => {
    expect(contract.tables.profiles.columns.username.nullable).toBe(false);
  });

  it("records production_tasks having no environment_id (dropped by migration 033)", () => {
    expect(contract.tables.production_tasks.columns.environment_id).toBeUndefined();
  });

  it("captures foreign keys so references can be rebuilt as refs", () => {
    const episodes = contract.tables.episodes.foreignKeys;
    expect(episodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ refTable: "projects", refColumn: "id" }),
      ])
    );
  });
});
