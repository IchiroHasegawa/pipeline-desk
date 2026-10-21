import { WorkflowEditor } from "@/components/settings-v3";

export default function WorkflowsSettingsNextPage() {
  return (
    <div className="flex h-full w-full flex-col min-h-0 border border-[var(--po-line)] rounded-[20px] overflow-hidden bg-[var(--po-card)] shadow-[var(--po-shadow-sm)]">
      <WorkflowEditor />
    </div>
  );
}
