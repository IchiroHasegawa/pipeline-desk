import WorkflowEditor from "@/components/settings/workflows/WorkflowEditor";

export default function WorkflowsSettingsPage() {
  return (
    <div className="flex h-full w-full flex-col min-h-0 border border-[#2a2a2a] rounded-md overflow-hidden bg-[#0a0a0a]">
      <WorkflowEditor />
    </div>
  );
}
