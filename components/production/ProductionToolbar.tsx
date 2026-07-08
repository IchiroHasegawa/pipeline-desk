import { Filter, ListFilter, MoreHorizontal, Plus, Upload } from "lucide-react";

export default function ProductionToolbar() {
  return (
    <div className="flex shrink-0 items-center justify-between px-4 py-3">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1 text-xs text-gray-300 transition-colors hover:text-white">
          <Plus className="h-4 w-4" />
          <span>Add Job</span>
        </button>

        <button className="flex items-center gap-1 text-xs text-gray-300 transition-colors hover:text-white">
          <Plus className="h-4 w-4" />
          <span>Add Tasks</span>
        </button>

        <div className="h-4 w-px bg-zinc-700" />

        <button aria-label="Filter" className="text-gray-400 transition-colors hover:text-white">
          <Filter className="h-4 w-4" />
        </button>

        <button aria-label="View options" className="text-gray-400 transition-colors hover:text-white">
          <ListFilter className="h-4 w-4" />
        </button>

        <button aria-label="Upload" className="text-gray-400 transition-colors hover:text-white">
          <Upload className="h-4 w-4" />
        </button>

        <button aria-label="More options" className="text-gray-400 transition-colors hover:text-white">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
