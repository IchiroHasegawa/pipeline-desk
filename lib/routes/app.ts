/**
 * Central route helpers for Production OS.
 *
 * During the UI redesign, `projectsHref` and `projectEpisodesHref` point to the
 * new `/projects-next` routes, while `episodeScenesHref` and `episodeManageHref`
 * point to the existing `/projects/...` routes.
 *
 * This file is the single switch point at final cutover.
 */

export function projectsHref(): string {
  return "/projects-next";
}

export function projectEpisodesHref(projectId: string): string {
  return `/projects-next/${encodeURIComponent(projectId)}/episodes`;
}

export function episodeScenesHref(projectId: string, episodeId: string): string {
  return `/projects-next/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/scenes`;
}

export function episodeManageHref(projectId: string, episodeId: string): string {
  return `/projects-next/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/manage`;
}

export function sceneManageHref(projectId: string, episodeId: string, sceneId: string): string {
  return `/projects-next/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/scenes/${encodeURIComponent(sceneId)}/manage`;
}

export function sceneAssemblyHref(
  projectId: string,
  episodeId: string,
  sceneId: string,
  keyframeId?: string | null
): string {
  const base = `/projects-next/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/scenes/${encodeURIComponent(sceneId)}/assembly`;
  return keyframeId ? `${base}?keyframeId=${encodeURIComponent(keyframeId)}` : base;
}
