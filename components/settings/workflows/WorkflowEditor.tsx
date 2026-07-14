"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, WorkflowProcess, WorkflowTaskStatus, getWorkflows, createWorkflow, updateWorkflow, retireWorkflow, restoreWorkflow, deleteWorkflow } from "@/lib/data/workflowRepository";

// Dummy components for now, will implement shortly.
import WorkflowSidebar from "./WorkflowSidebar";
import WorkflowDetail from "./WorkflowDetail";

export default function WorkflowEditor() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await getWorkflows(supabase);
      setWorkflows(data || []);
      setError(null);
    } catch (err: any) {
      setError("Unable to load Workflows.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedWorkflow = useMemo(() => {
    return workflows.find(w => w.id === selectedWorkflowId) || null;
  }, [workflows, selectedWorkflowId]);

  return (
    <div className="flex h-full w-full bg-[#0a0a0a]">
      {/* Left Panel */}
      <div className="w-[300px] shrink-0 border-r border-[#2a2a2a] bg-[#121212] flex flex-col">
        <WorkflowSidebar
          workflows={workflows}
          loading={loading}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={setSelectedWorkflowId}
          onRefresh={loadWorkflows}
          error={error}
        />
      </div>
      
      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0 overflow-hidden">
        {selectedWorkflow ? (
          <WorkflowDetail
            workflow={selectedWorkflow}
            onWorkflowUpdated={(updated) => {
              setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
            }}
            onWorkflowDeleted={(id) => {
              setWorkflows(prev => prev.filter(w => w.id !== id));
              if (selectedWorkflowId === id) setSelectedWorkflowId(null);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select an existing Workflow or create a new Workflow.
          </div>
        )}
      </div>
    </div>
  );
}
