/**
 * Central route helpers for Production OS.
 * Redesign cutover is complete.
 */

export function projectsHref(): string {
  return "/projects";
}

export function projectEpisodesHref(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/episodes`;
}

export function episodeScenesHref(projectId: string, episodeId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/scenes`;
}

export function episodeManageHref(projectId: string, episodeId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/manage`;
}

export function sceneManageHref(projectId: string, episodeId: string, sceneId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/scenes/${encodeURIComponent(sceneId)}/manage`;
}

export function sceneAssemblyHref(
  projectId: string,
  episodeId: string,
  sceneId: string,
  keyframeId?: string | null
): string {
  const base = `/projects/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}/scenes/${encodeURIComponent(sceneId)}/assembly`;
  return keyframeId ? `${base}?keyframeId=${encodeURIComponent(keyframeId)}` : base;
}

export function assetsHref(): string {
  return "/assets/manage";
}

export function projectAssetsHref(
  projectId: string,
  tab?: "episodes" | "assets"
): string {
  const base = `/assets/manage/${encodeURIComponent(projectId)}`;
  return tab === "assets" ? `${base}?tab=assets` : base;
}

export function episodeAssetsHref(
  projectId: string,
  episodeId: string
): string {
  return `/assets/manage/${encodeURIComponent(projectId)}/episodes/${encodeURIComponent(episodeId)}`;
}

export function assetAssemblyHref(projectId?: string): string {
  return projectId
    ? `/assets/assembly?projectId=${encodeURIComponent(projectId)}`
    : "/assets/assembly";
}

export function settingsHref(section?: string): string {
  return section ? `/settings/${encodeURIComponent(section)}` : "/settings";
}
