import type { ProductionEnvironment } from "@/types/production";

type EnvironmentTableProps = {
  environments: ProductionEnvironment[];
  selectedEnvironmentId: string | null;
  onSelectEnvironment: (environment: ProductionEnvironment) => void;
};

export default function EnvironmentTable({
  environments,
  selectedEnvironmentId,
  onSelectEnvironment,
}: EnvironmentTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto px-4">
      <table className="w-full min-w-[800px] border-collapse text-left">
        <thead className="border-b border-[#2a2a2a] text-[10px] font-bold uppercase text-zinc-500">
          <tr>
            <th className="sticky top-0 z-10 w-8 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              #
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Name
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Preview
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Description
            </th>
            
            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              Jobs
            </th>

            <th className="sticky top-0 z-10 w-24 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              Status
            </th>
          </tr>
        </thead>

        <tbody className="text-xs">
          {environments.map((env, index) => {
            const isSelected = env.id === selectedEnvironmentId;

            return (
              <tr
                key={env.id}
                onClick={() => onSelectEnvironment(env)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors hover:bg-zinc-900/50 ${
                  isSelected ? "bg-zinc-900/70" : "bg-transparent"
                }`}
              >
                <td className="px-2 py-2 text-center font-medium text-zinc-500">
                  {index + 1}
                </td>

                <td className="px-2 py-2 font-medium text-[#e0e0e0]">
                  {env.name}
                </td>

                <td className="px-2 py-2">
                  <div
                    aria-label={`${env.name} preview`}
                    className="flex h-10 w-16 items-center justify-center rounded bg-zinc-800 bg-cover bg-center text-[9px] text-zinc-500"
                    style={{
                      backgroundImage: env.thumbnailUrl ? `url(${env.thumbnailUrl})` : "none",
                    }}
                  >
                    <span className="rounded bg-black/50 px-1">Preview</span>
                  </div>
                </td>

                <td className="px-2 py-2 text-zinc-400">
                  {env.description || "—"}
                </td>

                <td className="px-2 py-2 text-center text-zinc-400">
                  {env.episodes?.length || 0}
                </td>
                
                <td className="px-2 py-2 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    env.status === "Active" 
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-zinc-500/10 text-zinc-500"
                  }`}>
                    {env.status}
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
