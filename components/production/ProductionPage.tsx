"use client";

import { useMemo, useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { mockProductions } from "@/data/mockProductions";
import type { EpisodeJob } from "@/types/production";
import BottomTaskPanel from "./BottomTaskPanel";
import EnvironmentDropdown from "./EnvironmentDropdown";
import EpisodeTable from "./EpisodeTable";
import ProductionToolbar from "./ProductionToolbar";
import RightDetailsPanel from "./RightDetailsPanel";

export default function ProductionPage() {
  const [selectedProductionId, setSelectedProductionId] = useState(
    mockProductions[0].id
  );

  const selectedProduction = useMemo(() => {
    return (
      mockProductions.find(
        (production) => production.id === selectedProductionId
      ) || mockProductions[0]
    );
  }, [selectedProductionId]);

  const [selectedJob, setSelectedJob] = useState<EpisodeJob>(
    selectedProduction.jobs[0]
  );

  function handleChangeProduction(productionId: string) {
    const production =
      mockProductions.find((item) => item.id === productionId) ||
      mockProductions[0];

    setSelectedProductionId(productionId);
    setSelectedJob(production.jobs[0]);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopNav />

      <main className="space-y-4 p-4">
        <ProductionToolbar />

        <EnvironmentDropdown
          productions={mockProductions}
          selectedProductionId={selectedProductionId}
          onChangeProduction={handleChangeProduction}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <EpisodeTable
              jobs={selectedProduction.jobs}
              selectedJobId={selectedJob.id}
              onSelectJob={setSelectedJob}
            />

            <BottomTaskPanel job={selectedJob} />
          </div>

          <RightDetailsPanel job={selectedJob} />
        </div>
      </main>
    </div>
  );
}