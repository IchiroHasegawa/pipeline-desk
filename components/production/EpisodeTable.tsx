import { useEffect, useRef, useState } from "react";

import type { Episode } from "@/types/production";

import ProgressCircle from "./ProgressCircle";
import { getAverageProgress, getEpisodeTasks, summarizeTasks, TaskRail } from "./productionTableUtils";

type EpisodeTableProps = {
  episodes: Episode[];
  selectedEpisodeId: string | null;
  onSelectEpisode: (episode: Episode) => void;
  onOpenEpisode: (episode: Episode) => void;
};

export default function EpisodeTable({
  episodes,
  selectedEpisodeId,
  onSelectEpisode,
  onOpenEpisode,
}: EpisodeTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const visibleIds = episodes.map((episode) => episode.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const isAllSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const isIndeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  function handleHeaderClick() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (isAllSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleRowCheck(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto px-4">
      <table className="w-full min-w-[1500px] border-collapse text-left">
        <thead className="border-b border-[#2a2a2a] text-[10px] font-bold uppercase text-zinc-500">
          <tr>
            <th className="sticky top-0 z-10 w-8 bg-[#121212] px-2 py-3 text-center shadow-[0_1px_0_#2a2a2a]">
              <input ref={headerCheckboxRef} type="checkbox" checked={isAllSelected} onChange={handleHeaderClick} className="rounded border-zinc-700 bg-zinc-900" />
            </th>
            <th className="sticky top-0 z-10 w-36 bg-[#121212] px-2 py-3 shadow-[0_1px_0_#2a2a2a]">Preview</th>
            <th className="sticky top-0 z-10 min-w-[180px] bg-[#121212] px-2 py-3 shadow-[0_1px_0_#2a2a2a]">Job Name ▲</th>
            <th className="sticky top-0 z-10 w-28 bg-[#121212] px-2 py-3 text-center shadow-[0_1px_0_#2a2a2a]">Completion</th>
            <th className="sticky top-0 z-10 min-w-[820px] bg-[#121212] px-4 py-3 shadow-[0_1px_0_#2a2a2a]">Tasks</th>
            <th className="sticky top-0 z-10 min-w-[280px] bg-[#121212] px-2 py-3 shadow-[0_1px_0_#2a2a2a]">Notes</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {episodes.map((episode) => {
            const isSelected = episode.id === selectedEpisodeId;
            const episodeTasks = summarizeTasks(getEpisodeTasks(episode));

            return (
              <tr
                key={episode.id}
                onClick={() => onSelectEpisode(episode)}
                onDoubleClick={() => onOpenEpisode(episode)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors hover:bg-zinc-900/50 ${isSelected ? "bg-zinc-900/70" : "bg-transparent"}`}
              >
                <td className="px-2 py-3 text-center font-medium text-zinc-500" onClick={(event) => handleRowCheck(event, episode.id)}>
                  <input type="checkbox" checked={selectedIds.has(episode.id)} readOnly className="rounded border-zinc-700 bg-zinc-900" />
                </td>
                <td className="px-2 py-3">
                  <div
                    aria-label={`${episode.episodeName} preview`}
                    className="flex h-16 w-28 shrink-0 items-center justify-center rounded bg-zinc-800 bg-cover bg-center text-[9px] text-zinc-500"
                    style={{ backgroundImage: episode.previewImage ? `url(${episode.previewImage})` : "none" }}
                  >
                    {!episode.previewImage && <span className="rounded bg-black/50 px-1">Preview</span>}
                  </div>
                </td>
                <td className="px-2 py-3 font-medium text-[#e0e0e0]">{episode.episodeName}</td>
                <td className="px-2 py-3 text-center">
                  <div className="flex justify-center">
                    <ProgressCircle value={getAverageProgress(getEpisodeTasks(episode))} size={50} />
                  </div>
                </td>
                <td className="min-w-[820px] px-4 py-3"><TaskRail tasks={episodeTasks} /></td>
                <td className="min-w-[280px] px-2 py-3 text-zinc-400">{episode.description || "No notes available."}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
