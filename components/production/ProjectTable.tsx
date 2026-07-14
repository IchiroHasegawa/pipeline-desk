import { useEffect, useRef, useState } from "react";

import type { Project } from "@/types/production";

import ProgressCircle from "./ProgressCircle";
import { getAverageProgress, getProjectTasks, ProgressSummary } from "./productionTableUtils";

type ProjectTableProps = {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onOpenProject: (project: Project) => void;
};

export default function ProjectTable({
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenProject,
}: ProjectTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const visibleIds = projects.map((project) => project.id);
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
      <table className="w-full min-w-[1640px] border-collapse text-left">
        <thead className="border-b border-[#2a2a2a] text-[10px] font-bold uppercase text-zinc-500">
          <tr>
            <th className="sticky top-0 z-10 w-8 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={isAllSelected}
                onChange={handleHeaderClick}
                className="rounded border-zinc-700 bg-zinc-900"
              />
            </th>
            <th className="sticky top-0 z-10 min-w-[180px] bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">Title</th>
            <th className="sticky top-0 z-10 min-w-[140px] bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">Project Code</th>
            <th className="sticky top-0 z-10 w-36 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">Preview</th>
            <th className="sticky top-0 z-10 w-28 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">Completion</th>
            <th className="sticky top-0 z-10 min-w-[760px] bg-[#121212] px-4 py-2 shadow-[0_1px_0_#2a2a2a]">Tasks</th>
            <th className="sticky top-0 z-10 min-w-[280px] bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">Notes</th>
            <th className="sticky top-0 z-10 w-28 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">Environments</th>
            <th className="sticky top-0 z-10 w-24 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">Status</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {projects.map((project) => {
            const isSelected = project.id === selectedProjectId;
            const projectTasks = getProjectTasks(project);

            return (
              <tr
                key={project.id}
                onClick={() => onSelectProject(project)}
                onDoubleClick={() => onOpenProject(project)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors hover:bg-zinc-900/50 ${isSelected ? "bg-zinc-900/70" : "bg-transparent"}`}
              >
                <td className="px-2 py-3 text-center font-medium text-zinc-500" onClick={(event) => handleRowCheck(event, project.id)}>
                  <input type="checkbox" checked={selectedIds.has(project.id)} readOnly className="rounded border-zinc-700 bg-zinc-900" />
                </td>
                <td className="px-2 py-3 font-medium text-[#e0e0e0]">{project.title}</td>
                <td className="px-2 py-3 text-zinc-400">{project.projectCode}</td>
                <td className="px-2 py-3">
                  <div
                    aria-label={`${project.title} preview`}
                    className="flex h-16 w-28 items-center justify-center rounded bg-zinc-800 bg-cover bg-center text-[9px] text-zinc-500"
                    style={{ backgroundImage: project.thumbnailUrl ? `url(${project.thumbnailUrl})` : "none" }}
                  >
                    {!project.thumbnailUrl && <span className="rounded bg-black/50 px-1">Preview</span>}
                  </div>
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="flex justify-center">
                    <ProgressCircle value={getAverageProgress(projectTasks)} size={50} />
                  </div>
                </td>
                <td className="min-w-[760px] px-4 py-3"><ProgressSummary tasks={projectTasks} /></td>
                <td className="min-w-[280px] px-2 py-3 text-zinc-400">{project.description || "No notes available."}</td>
                <td className="px-2 py-3 text-center text-zinc-400">{project.environments?.length || 0}</td>
                <td className="px-2 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${project.status === "Active" ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"}`}>
                    {project.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
