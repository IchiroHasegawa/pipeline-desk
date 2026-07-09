import type { Episode } from "@/types/production";

type EpisodeDropdownProps = {
  episodes: Episode[];
  selectedEpisodeId: "ALL" | string;
  onChangeEpisode: (episodeId: "ALL" | string) => void;
};

export default function EpisodeDropdown({
  episodes,
  selectedEpisodeId,
  onChangeEpisode,
}: EpisodeDropdownProps) {
  return (
    <select
      value={selectedEpisodeId}
      onChange={(event) => onChangeEpisode(event.target.value)}
      className="min-w-40 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none"
    >
      <option value="ALL">ALL</option>

      {episodes.map((episode) => (
        <option key={episode.id} value={episode.id}>
          {episode.episodeName}
        </option>
      ))}
    </select>
  );
}
