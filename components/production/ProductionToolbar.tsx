import { Filter, ListFilter, MoreHorizontal, Plus, Upload } from "lucide-react";

type ProductionToolbarProps = {
  viewLevel: "PROJECT" | "ENVIRONMENT" | "JOB" | "SCENE";
  onAdd: () => void;
  onManage?: () => void;
};

export default function ProductionToolbar({ viewLevel, onAdd, onManage }: ProductionToolbarProps) {
  const addLabel = 
    viewLevel === "PROJECT" ? "Add Project" :
    viewLevel === "ENVIRONMENT" ? "Add Environment" :
    viewLevel === "JOB" ? "Add Job" : "Add Scene";
    
  const manageLabel = 
    viewLevel === "PROJECT" ? "Manage Projects" :
    viewLevel === "ENVIRONMENT" ? "Manage Environments" :
    viewLevel === "JOB" ? "Manage Jobs" : "Manage Scenes";

  return (
    <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
      <div className="flex items-center gap-4">
        <button 
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-gray-300 transition-colors hover:text-white"
        >
          <Plus className="h-4 w-4" />
          <span>{addLabel}</span>
        </button>
        
        {onManage && (
          <button 
            onClick={onManage}
            className="flex items-center gap-1 text-xs text-gray-300 transition-colors hover:text-white ml-2"
          >
            <Upload className="h-4 w-4" />
            <span>{manageLabel}</span>
          </button>
        )}

        <div className="h-4 w-px bg-zinc-700" />

        <button aria-label="Filter" className="text-gray-400 transition-colors hover:text-white">
          <Filter className="h-4 w-4" />
        </button>

        <button aria-label="View options" className="text-gray-400 transition-colors hover:text-white">
          <ListFilter className="h-4 w-4" />
        </button>

        <button aria-label="More options" className="text-gray-400 transition-colors hover:text-white">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
