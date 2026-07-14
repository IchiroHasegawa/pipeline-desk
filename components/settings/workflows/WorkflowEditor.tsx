"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, getWorkflows } from "@/lib/data/workflowRepository";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadWorkflows() {
    setLoading(true);
    try {
      const data = await getWorkflows(supabase);
      setWorkflows(data || []);
      setError(null);
    } catch (err) {
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
    <div className="flex h-full w-full min-h-0">
      {/* Left Panel */}
      <div className="w-[300px] shrink-0 border-r border-[#2a2a2a] bg-[#121212] flex flex-col min-h-0">
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
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {selectedWorkflow ? (
          <WorkflowDetail 
            workflow={selectedWorkflow} 
            onWorkflowUpdated={(w) => {
              setWorkflows(prev => prev.map(old => old.id === w.id ? w : old));
            }}
            onWorkflowDeleted={(id) => {
              setWorkflows(prev => prev.filter(w => w.id !== id));
              setSelectedWorkflowId(null);
            }}
          />
        ) : (
          <div className="flex h-full flex-col">
            <div className="p-6 border-b border-[#2a2a2a]">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <span>Workflow Editor</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-1">Workflow Editor</h3>
                <p className="text-sm">Select an existing Workflow or create a new Workflow.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
