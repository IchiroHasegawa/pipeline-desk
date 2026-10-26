import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Board } from "@/lib/models/Board";
import { BoardElement } from "@/lib/models/BoardElement";
import { Todo } from "@/lib/models/Todo";

let mongo: TestMongo;
const models = [Board, BoardElement, Todo];

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Promise.all(models.map((m) => m.syncIndexes()));
});

afterEach(async () => {
  await Promise.all(models.map((m) => m.deleteMany({})));
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

describe("Board", () => {
  // CHECK: exactly one of scene_id / project_id
  it.each([
    ["projectId", { projectId: "p1" }],
    ["sceneId", { sceneId: "s1" }],
  ])("accepts a board scoped to %s", async (_n, scope) => {
    await expect(Board.create(scope)).resolves.toBeTruthy();
  });

  it("rejects a board with no scope", async () => {
    await expect(Board.create({})).rejects.toThrow(/validation/i);
  });

  it("rejects a board scoped to both a project and a scene", async () => {
    await expect(Board.create({ projectId: "p1", sceneId: "s1" })).rejects.toThrow(/validation/i);
  });

  // boards_project_uniq ON (project_id) WHERE project_id IS NOT NULL
  it("allows only one board per project", async () => {
    await Board.create({ projectId: "p1" });
    await expect(Board.create({ projectId: "p1" })).rejects.toThrow(/duplicate key/i);
  });

  // boards_scene_uniq ON (scene_id) WHERE scene_id IS NOT NULL
  it("allows only one board per scene", async () => {
    await Board.create({ sceneId: "s1" });
    await expect(Board.create({ sceneId: "s1" })).rejects.toThrow(/duplicate key/i);
  });

  it("allows boards for different projects and different scenes", async () => {
    await Board.create({ projectId: "p1" });
    await Board.create({ sceneId: "s1" });
    await expect(Board.create({ projectId: "p2" })).resolves.toBeTruthy();
    await expect(Board.create({ sceneId: "s2" })).resolves.toBeTruthy();
  });

  // Both unique indexes are partial, so the many project-scoped boards (whose
  // sceneId is absent) must not collide with each other on sceneId.
  it("does not let project boards collide on their absent sceneId", async () => {
    await Board.create({ projectId: "p1" });
    await expect(Board.create({ projectId: "p2" })).resolves.toBeTruthy();
    expect(await Board.countDocuments()).toBe(2);
  });
});

describe("BoardElement", () => {
  const el = { boardId: "b1", elementType: "comment" };

  it("defaults x, y and zIndex to 0", async () => {
    const e = await BoardElement.create(el);
    expect([e.x, e.y, e.zIndex]).toEqual([0, 0, 0]);
  });

  // CHECK (element_type IN ('keyframe','asset','folder','comment','arrow'))
  it.each(["asset", "folder", "comment"])("accepts elementType %o", async (elementType) => {
    await expect(BoardElement.create({ boardId: "b1", elementType })).resolves.toBeTruthy();
  });

  it("rejects an elementType outside the contract", async () => {
    await expect(BoardElement.create({ boardId: "b1", elementType: "sticky" })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (element_type <> 'arrow' OR (from IS NOT NULL AND to IS NOT NULL AND from <> to))
  it("requires an arrow to have two distinct ends", async () => {
    await expect(BoardElement.create({ boardId: "b1", elementType: "arrow" })).rejects.toThrow(
      /validation/i
    );
    await expect(
      BoardElement.create({ boardId: "b1", elementType: "arrow", fromElementId: "e1" })
    ).rejects.toThrow(/validation/i);
    await expect(
      BoardElement.create({
        boardId: "b1",
        elementType: "arrow",
        fromElementId: "e1",
        toElementId: "e1",
      })
    ).rejects.toThrow(/validation/i);
    await expect(
      BoardElement.create({
        boardId: "b1",
        elementType: "arrow",
        fromElementId: "e1",
        toElementId: "e2",
      })
    ).resolves.toBeTruthy();
  });

  // CHECK (element_type <> 'keyframe' OR asset_id/asset_file_id/image_url present)
  it("requires a keyframe to reference an asset, asset file or image", async () => {
    await expect(BoardElement.create({ boardId: "b1", elementType: "keyframe" })).rejects.toThrow(
      /validation/i
    );
    await expect(
      BoardElement.create({ boardId: "b1", elementType: "keyframe", imageUrl: "u" })
    ).resolves.toBeTruthy();
  });

  // CHECK (parent_folder_id IS NULL OR parent_folder_id <> id)
  it("rejects an element that is its own parent folder", async () => {
    await expect(
      BoardElement.create({ _id: "e-self", boardId: "b1", elementType: "folder", parentFolderId: "e-self" })
    ).rejects.toThrow(/validation/i);
  });

  // board_elements_keyframe_number_uniq ON (board_id, keyframe_number)
  //   WHERE element_type = 'keyframe' AND keyframe_number IS NOT NULL
  it("rejects two keyframes with the same number on one board", async () => {
    const kf = { boardId: "b1", elementType: "keyframe", imageUrl: "u", keyframeNumber: 1 };
    await BoardElement.create(kf);
    await expect(BoardElement.create(kf)).rejects.toThrow(/duplicate key/i);
  });

  it("allows the same keyframe number on different boards", async () => {
    const kf = { elementType: "keyframe", imageUrl: "u", keyframeNumber: 1 };
    await BoardElement.create({ ...kf, boardId: "b1" });
    await expect(BoardElement.create({ ...kf, boardId: "b2" })).resolves.toBeTruthy();
  });

  it("allows many keyframes with no number", async () => {
    const kf = { boardId: "b1", elementType: "keyframe", imageUrl: "u" };
    await BoardElement.create(kf);
    await expect(BoardElement.create(kf)).resolves.toBeTruthy();
  });

  // The index is restricted to keyframes, so other element types sharing a
  // number must not collide.
  it("does not apply the keyframe-number rule to other element types", async () => {
    const row = { boardId: "b1", elementType: "comment", keyframeNumber: 1 };
    await BoardElement.create(row);
    await expect(BoardElement.create(row)).resolves.toBeTruthy();
  });
});

describe("Todo", () => {
  // In Postgres user_id defaulted to auth.uid(). There is no database session
  // any more, so the application must supply it — and the model makes that
  // failure loud rather than silent.
  it("requires a profileId", async () => {
    await expect(Todo.create({ title: "x", sceneId: "s1" })).rejects.toThrow(/validation/i);
  });

  // CHECK: exactly one of episode_id / scene_id
  it.each([
    ["sceneId", { sceneId: "s1" }],
    ["episodeId", { episodeId: "e1" }],
  ])("accepts a todo scoped to %s", async (_n, scope) => {
    await expect(Todo.create({ title: "x", profileId: "u1", ...scope })).resolves.toBeTruthy();
  });

  it("rejects a todo with no scope or both scopes", async () => {
    await expect(Todo.create({ title: "x", profileId: "u1" })).rejects.toThrow(/validation/i);
    await expect(
      Todo.create({ title: "x", profileId: "u1", sceneId: "s1", episodeId: "e1" })
    ).rejects.toThrow(/validation/i);
  });

  // CHECK (length(btrim(title)) > 0)
  it.each(["", "   ", "\t"])("rejects the blank title %o", async (title) => {
    await expect(Todo.create({ title, profileId: "u1", sceneId: "s1" })).rejects.toThrow(
      /validation/i
    );
  });

  it("starts uncompleted", async () => {
    const t = await Todo.create({ title: "x", profileId: "u1", sceneId: "s1" });
    expect(t.completedAt).toBeUndefined();
  });
});
