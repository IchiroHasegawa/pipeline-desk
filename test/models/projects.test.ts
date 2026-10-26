import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Project } from "@/lib/models/Project";
import { Episode } from "@/lib/models/Episode";
import { Scene } from "@/lib/models/Scene";
import { Day } from "@/lib/models/Day";
import { SceneNote } from "@/lib/models/SceneNote";

let mongo: TestMongo;

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Promise.all([
    Project.syncIndexes(),
    Episode.syncIndexes(),
    Scene.syncIndexes(),
    Day.syncIndexes(),
    SceneNote.syncIndexes(),
  ]);
});

afterEach(async () => {
  await Promise.all([
    Project.deleteMany({}),
    Episode.deleteMany({}),
    Scene.deleteMany({}),
    Day.deleteMany({}),
    SceneNote.deleteMany({}),
  ]);
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

const project = { title: "Demo", projectCode: "DEMO_01" };

describe("Project", () => {
  it("requires a title and a projectCode", async () => {
    await expect(Project.create({})).rejects.toThrow(/validation/i);
  });

  it("enforces a unique projectCode", async () => {
    await Project.create(project);
    await expect(Project.create({ title: "Other", projectCode: "DEMO_01" })).rejects.toThrow(
      /duplicate key/i
    );
  });

  // CHECK (project_code ~ '^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$')
  it.each(["has space", "trailing_", "_leading", "double__us", "has-dash"])(
    "rejects the projectCode %o",
    async (projectCode) => {
      await expect(Project.create({ title: "x", projectCode })).rejects.toThrow(/validation/i);
    }
  );

  it.each(["DEMO", "DEMO_01", "A1_b2_C3"])("accepts the projectCode %o", async (projectCode) => {
    await expect(Project.create({ title: "x", projectCode })).resolves.toBeTruthy();
  });

  // CHECK (status IN ('Active','Retired'))
  it("defaults status to Active and rejects anything off-contract", async () => {
    expect((await Project.create(project)).status).toBe("Active");
    await expect(Project.create({ ...project, projectCode: "X2", status: "Archived" })).rejects.toThrow(
      /validation/i
    );
  });

  it("defaults isSystem to false and boardLayout to an empty object", async () => {
    const p = await Project.create(project);
    expect(p.isSystem).toBe(false);
    expect(p.boardLayout).toEqual({});
  });

  it("round-trips boardLayout as a nested object", async () => {
    await Project.create({ ...project, boardLayout: { cols: [{ id: "a", w: 2 }] } });
    const got = await Project.findOne({ projectCode: "DEMO_01" }).lean();
    expect(got!.boardLayout).toEqual({ cols: [{ id: "a", w: 2 }] });
  });

  // UNIQUE INDEX projects_single_system_idx ON ((true)) WHERE is_system
  it("allows at most one system project", async () => {
    await Project.create({ ...project, isSystem: true });
    await expect(
      Project.create({ title: "Other", projectCode: "UNKNOWN2", isSystem: true })
    ).rejects.toThrow(/duplicate key/i);
  });

  it("still allows many non-system projects", async () => {
    await Project.create(project);
    await expect(Project.create({ title: "Two", projectCode: "DEMO_02" })).resolves.toBeTruthy();
  });
});

describe("Episode", () => {
  it("requires projectId and episodeName", async () => {
    await expect(Episode.create({})).rejects.toThrow(/validation/i);
  });

  it("defaults status to Active", async () => {
    const e = await Episode.create({ projectId: "p1", episodeName: "Ep 1" });
    expect(e.status).toBe("Active");
  });
});

describe("Scene", () => {
  it("requires episodeId and sceneName", async () => {
    await expect(Scene.create({})).rejects.toThrow(/validation/i);
  });

  it("defaults priority to 4 and numberOfFrames to 1", async () => {
    const s = await Scene.create({ episodeId: "e1", sceneName: "Sc 1" });
    expect([s.priority, s.numberOfFrames]).toEqual([4, 1]);
  });

  // CHECK (priority IN (1,2,3,4,5))
  it.each([0, 6, 2.5])("rejects priority %o", async (priority) => {
    await expect(Scene.create({ episodeId: "e1", sceneName: "s", priority })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (number_of_frames >= 1)
  it("rejects numberOfFrames below 1", async () => {
    await expect(
      Scene.create({ episodeId: "e1", sceneName: "s", numberOfFrames: 0 })
    ).rejects.toThrow(/validation/i);
  });
});

describe("Day", () => {
  it("requires episodeId and dayDate", async () => {
    await expect(Day.create({ episodeId: "e1" })).rejects.toThrow(/validation/i);
  });
});

describe("SceneNote", () => {
  it("requires sceneId and content", async () => {
    await expect(SceneNote.create({ sceneId: "s1" })).rejects.toThrow(/validation/i);
  });
});
