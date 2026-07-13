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
      className="rounded border border-zinc-700 bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none focus:border-zinc-500"
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
