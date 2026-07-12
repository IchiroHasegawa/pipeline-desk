import type { Project } from "@/types/production";

type ProjectDropdownProps = {
  projects: Project[];
  selectedProjectId: string;
  onChangeProject: (projectId: string) => void;
};

export default function ProjectDropdown({
  projects,
  selectedProjectId,
  onChangeProject,
}: ProjectDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400">
        Project:
      </label>

      <select
        value={selectedProjectId}
        onChange={(event) => onChangeProject(event.target.value)}
        className="rounded border border-zinc-700 bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none focus:border-zinc-500"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    </div>
  );
}
