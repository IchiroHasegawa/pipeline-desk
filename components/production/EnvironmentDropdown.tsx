import { Search } from "lucide-react";

import type { ProductionEnvironment } from "@/types/production";

type EnvironmentDropdownProps = {
  productions: ProductionEnvironment[];
  selectedProductionId: string;
  onChangeProduction: (
    productionId: string
  ) => void;
};

export default function EnvironmentDropdown({
  productions,
  selectedProductionId,
  onChangeProduction,
}: EnvironmentDropdownProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">
          Environment:
        </label>

        <select
          value={selectedProductionId}
          onChange={(event) =>
            onChangeProduction(event.target.value)
          }
          className="rounded border border-zinc-700 bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none focus:border-zinc-500"
        >
          <option value="ALL">ALL</option>
          {productions.map((production) => (
            <option
              key={production.id}
              value={production.id}
            >
              {production.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />

        <input
          type="text"
          placeholder="Quick Search"
          className="w-64 rounded border border-zinc-700 bg-black py-1 pl-8 pr-2 text-xs text-[#e0e0e0] outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>
    </>
  );
}