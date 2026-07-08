import type { ProductionEnvironment } from "@/types/production";

type EnvironmentDropdownProps = {
  productions: ProductionEnvironment[];
  selectedProductionId: string;
  onChangeProduction: (productionId: string) => void;
};

export default function EnvironmentDropdown({
  productions,
  selectedProductionId,
  onChangeProduction,
}: EnvironmentDropdownProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
      <label className="text-sm text-slate-400">Environment</label>

      <select
        value={selectedProductionId}
        onChange={(event) => onChangeProduction(event.target.value)}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none"
      >
        {productions.map((production) => (
          <option key={production.id} value={production.id}>
            {production.name}
          </option>
        ))}
      </select>
    </div>
  );
}