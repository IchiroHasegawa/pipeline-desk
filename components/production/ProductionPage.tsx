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
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0a0a0a] text-[#e0e0e0]">
      <TopNav />

      <EnvironmentDropdown
        productions={mockProductions}
        selectedProductionId={selectedProductionId}
        onChangeProduction={handleChangeProduction}
      />

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductionToolbar />

          <EpisodeTable
            jobs={selectedProduction.jobs}
            selectedJobId={selectedJob.id}
            onSelectJob={setSelectedJob}
          />

          <BottomTaskPanel job={selectedJob} />
        </section>

        <RightDetailsPanel job={selectedJob} />
      </main>
    </div>
  );
}
