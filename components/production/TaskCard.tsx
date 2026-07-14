"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import type { ProductionTask, TaskStatus } from "@/types/production";
import { createClient } from "@/lib/supabase/client";
import { getTaskStatuses, WorkflowTaskStatus } from "@/lib/data/workflowRepository";

type TaskCardProps = {
  task: ProductionTask;
  isAssetTask?: boolean;
};

function getTaskCardClasses(taskName: string) {
  if (taskName === "Storyboard") {
    return {
      shell: "bg-blue-50 border-blue-300",
      header: "border-blue-200 text-blue-600",
      row: "border-blue-100 bg-white",
    };
  }

  if (taskName === "Production") {
    return {
      shell: "bg-lime-50 border-lime-300",
      header: "border-lime-200 text-lime-700",
      row: "border-lime-100 bg-white",
    };
  }

  if (taskName === "Layout") {
    return {
      shell: "bg-blue-100 border-blue-400",
      header: "border-blue-300 text-blue-800",
      row: "border-blue-200 bg-white",
    };
  }

  return {
    shell: "bg-white border-zinc-400",
    header: "border-zinc-300 text-zinc-500",
    row: "border-zinc-200 bg-white",
  };
}

function getStatusClasses(statusName: string, dynamicColour?: string) {
  if (dynamicColour) {
    return {
      style: {
        backgroundColor: `${dynamicColour}33`, // 20% opacity approx
        borderColor: `${dynamicColour}66`, // 40% opacity approx
        color: dynamicColour
      }
    };
  }

  // Fallbacks for legacy/hardcoded statuses
  if (statusName === "Approved") return { className: "border-green-500/40 bg-green-500/20 text-green-700" };
  if (statusName === "Rejected") return { className: "border-red-500/40 bg-red-500/20 text-red-700" };
  if (statusName === "In Progress" || statusName === "Review") {
    return { className: "border-yellow-500/40 bg-yellow-500/20 text-yellow-700" };
  }

  return { className: "border-zinc-200 bg-zinc-100 text-zinc-700" };
}

export default function TaskCard({ task, isAssetTask = false }: TaskCardProps) {
  const classes = getTaskCardClasses(task.name);
  
  const [isOpen, setIsOpen] = useState(false);
  const [statuses, setStatuses] = useState<WorkflowTaskStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  
  // Local state for optimistic updates
  const [currentStatusId, setCurrentStatusId] = useState(task.status_id);
  const [currentStatusName, setCurrentStatusName] = useState(task.status);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentStatusId(task.status_id);
    setCurrentStatusName(task.status);
  }, [task.status_id, task.status]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = async () => {
    if (!task.process_id) return; // Cannot load dynamic statuses if no process
    setIsOpen(!isOpen);
    
    if (!isOpen && statuses.length === 0) {
      setLoadingStatuses(true);
      try {
        const supabase = createClient();
        const { data: process } = await supabase
          .from("workflow_processes")
          .select("task_status_workflow_id")
          .eq("id", task.process_id)
          .single();
          
        if (process?.task_status_workflow_id) {
          const fetchedStatuses = await getTaskStatuses(supabase, process.task_status_workflow_id);
          setStatuses(fetchedStatuses || []);
        }
      } catch (err) {
        console.error("Failed to load statuses", err);
      } finally {
        setLoadingStatuses(false);
      }
    }
  };

  const handleStatusChange = async (newStatus: WorkflowTaskStatus) => {
    setIsOpen(false);
    setIsUpdating(true);
    
    // Optimistic UI update
    setCurrentStatusId(newStatus.id);
    setCurrentStatusName(newStatus.name as TaskStatus);
    
    try {
      const supabase = createClient();
      const table = isAssetTask ? "asset_tasks" : "production_tasks";
      
      const { error } = await supabase
        .from(table)
        .update({ 
          task_status_definition_id: newStatus.id,
          status: newStatus.status_code || newStatus.name,
          progress: newStatus.completion_percentage
        })
        .eq("id", task.id);
        
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update status", err);
      // Revert optimistic update
      setCurrentStatusId(task.status_id);
      setCurrentStatusName(task.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusObj = statuses.find(s => s.id === currentStatusId);
  const statusStyling = getStatusClasses(currentStatusName, currentStatusObj?.colour);

  return (
    <div
      className={`min-w-[120px] shrink-0 overflow-visible rounded border text-black ${classes.shell}`}
    >
      <div
        className={`border-b py-0.5 text-center text-[10px] font-bold ${classes.header}`}
      >
        {task.name}
      </div>

      <div className="space-y-0.5 p-1 text-[9px] relative">
        <div className={`flex items-center rounded border px-1 ${classes.row}`}>
          <span className="w-8 text-zinc-400">Start</span>
          <span className="flex-1 text-right">{task.startDate}</span>
        </div>

        <div className={`flex items-center rounded border px-1 ${classes.row}`}>
          <span className="w-8 text-zinc-400">End</span>
          <span className="flex-1 text-right">{task.endDate}</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            disabled={!task.process_id || isUpdating}
            className={`flex w-full items-center justify-between rounded border px-1 py-0.5 transition-colors ${statusStyling.className || ""} ${task.process_id ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            style={statusStyling.style}
          >
            <span className="truncate">{currentStatusName}</span>
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : task.process_id ? (
              <ChevronDown className="h-3 w-3" />
            ) : null}
          </button>
          
          {isOpen && task.process_id && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-zinc-200 rounded shadow-lg overflow-hidden py-1">
              {loadingStatuses ? (
                <div className="px-2 py-1 text-zinc-400 text-center flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> Loading...
                </div>
              ) : statuses.length === 0 ? (
                <div className="px-2 py-1 text-zinc-400">No statuses found</div>
              ) : (
                <div className="max-h-32 overflow-y-auto">
                  {statuses.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleStatusChange(s)}
                      className="w-full text-left px-2 py-1 hover:bg-zinc-100 flex items-center gap-1.5 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.colour }} />
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5">
          <span>{task.assignee || "Unassigned"}</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
