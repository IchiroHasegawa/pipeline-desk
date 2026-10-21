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

export function assetsHref(): string {
  return "/assets/manage-next";
}

export function projectAssetsHref(
  projectId: string,
  tab?: "episodes" | "assets"
): string {
  const base = `/assets/manage-next/${encodeURIComponent(projectId)}`;
  return tab === "assets" ? `${base}?tab=assets` : base;
}

export function episodeAssetsHref(
  projectId: string,
  episodeId: string
): string {
  return `/assets/manage-next/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}`;
}

export function assetAssemblyHref(projectId?: string): string {
  return projectId
    ? `/assets/assembly-next?projectId=${encodeURIComponent(projectId)}`
    : "/assets/assembly-next";
}

export function settingsHref(section?: string): string {
  return section ? `/settings-next/${encodeURIComponent(section)}` : "/settings-next";
}



