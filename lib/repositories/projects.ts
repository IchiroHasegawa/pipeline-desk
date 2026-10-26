import { Project, type ProjectDoc } from "@/lib/models/Project";
import { Episode, type EpisodeDoc } from "@/lib/models/Episode";
import { Scene, type SceneDoc } from "@/lib/models/Scene";
import { Day, type DayDoc } from "@/lib/models/Day";
import { SceneNote, type SceneNoteDoc } from "@/lib/models/SceneNote";
import { baseRepo } from "./base";
import { requireActiveUser, type Actor } from "@/lib/permissions";

const projectBase = baseRepo<ProjectDoc>(Project, { immutable: ["isSystem"] });

export const projects = {
  ...projectBase,

  /** Active projects, system project excluded — the normal project list. */
  async listVisible(actor: Actor): Promise<ProjectDoc[]> {
    requireActiveUser(actor);
    return Project.find({ isSystem: false, status: "Active" })
      .sort({ title: 1 })
      .lean<ProjectDoc[]>()
      .exec();
  },

  async getByCode(actor: Actor, projectCode: string): Promise<ProjectDoc | null> {
    requireActiveUser(actor);
    return Project.findOne({ projectCode }).lean<ProjectDoc>().exec();
  },

  /** The single `is_system` project (migration 032's "Unknown"). */
  async getSystemProject(actor: Actor): Promise<ProjectDoc | null> {
    requireActiveUser(actor);
    return Project.findOne({ isSystem: true }).lean<ProjectDoc>().exec();
  },
};

export const episodes = {
  ...baseRepo<EpisodeDoc>(Episode),

  async listByProject(actor: Actor, projectId: string): Promise<EpisodeDoc[]> {
    requireActiveUser(actor);
    return Episode.find({ projectId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<EpisodeDoc[]>()
      .exec();
  },
};

export const scenes = {
  ...baseRepo<SceneDoc>(Scene),

  async listByEpisode(actor: Actor, episodeId: string): Promise<SceneDoc[]> {
    requireActiveUser(actor);
    return Scene.find({ episodeId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<SceneDoc[]>()
      .exec();
  },
};

export const days = {
  ...baseRepo<DayDoc>(Day),

  async listByEpisode(actor: Actor, episodeId: string): Promise<DayDoc[]> {
    requireActiveUser(actor);
    return Day.find({ episodeId })
      .sort({ dayDate: 1 })
      .lean<DayDoc[]>()
      .exec();
  },
};

export const sceneNotes = {
  ...baseRepo<SceneNoteDoc>(SceneNote),

  async listByScene(actor: Actor, sceneId: string): Promise<SceneNoteDoc[]> {
    requireActiveUser(actor);
    return SceneNote.find({ sceneId })
      .sort({ createdAt: -1 })
      .lean<SceneNoteDoc[]>()
      .exec();
  },
};
