import type { Project } from "@/types/production";

type ProjectTableProps = {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (project: Project) => void;
};

export default function ProjectTable({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto px-4">
      <table className="w-full min-w-[800px] border-collapse text-left">
        <thead className="border-b border-[#2a2a2a] text-[10px] font-bold uppercase text-zinc-500">
          <tr>
            <th className="sticky top-0 z-10 w-8 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              #
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Title
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Project Code
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Preview
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Description
            </th>
            
            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              Environments
            </th>

            <th className="sticky top-0 z-10 w-24 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              Status
            </th>
          </tr>
        </thead>

        <tbody className="text-xs">
          {projects.map((project, index) => {
            const isSelected = project.id === selectedProjectId;

            return (
              <tr
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors hover:bg-zinc-900/50 ${
                  isSelected ? "bg-zinc-900/70" : "bg-transparent"
                }`}
              >
                <td className="px-2 py-2 text-center font-medium text-zinc-500">
                  {index + 1}
                </td>

                <td className="px-2 py-2 font-medium text-[#e0e0e0]">
                  {project.title}
                </td>
                
                <td className="px-2 py-2 text-zinc-400">
                  {project.projectCode}
                </td>

                <td className="px-2 py-2">
                  <div
                    aria-label={`${project.title} preview`}
                    className="flex h-10 w-16 items-center justify-center rounded bg-zinc-800 bg-cover bg-center text-[9px] text-zinc-500"
                    style={{
                      backgroundImage: project.thumbnailUrl ? `url(${project.thumbnailUrl})` : "none",
                    }}
                  >
                    <span className="rounded bg-black/50 px-1">Preview</span>
                  </div>
                </td>

                <td className="px-2 py-2 text-zinc-400">
                  {project.description || "—"}
                </td>

                <td className="px-2 py-2 text-center text-zinc-400">
                  {project.environments?.length || 0}
                </td>
                
                <td className="px-2 py-2 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    project.status === "Active" 
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-zinc-500/10 text-zinc-500"
                  }`}>
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
