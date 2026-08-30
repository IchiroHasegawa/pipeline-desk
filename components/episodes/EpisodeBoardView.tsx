"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BoardHeader from "@/components/shell/BoardHeader";
import BottomNav from "@/components/shell/BottomNav";
import EpisodeFormDialog from "@/components/episodes/EpisodeFormDialog";
import ProcessCard from "@/components/episodes/ProcessCard";
import { BOARD_ACCENT, HAIRLINE } from "@/lib/design/boardTokens";
import { createEpisodeV2 } from "@/app/actions/production";
import type {
  ProjectV2,
  EpisodeV2,
  ProcessProgress,
} from "@/types/production-v2";

export type EpisodeBoardViewProps = {
  project: ProjectV2;
  initialEpisodes: EpisodeV2[];
  processProgress: Record<string, ProcessProgress[]>;
  initialError?: string | null;
};

const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * 9) / 16); // 16:9
const NAME_COLUMN_WIDTH = 260;
const NOTES_COLUMN_WIDTH = 220;
const COLUMN_GAP = 20;
const ROW_PADDING_Y = 16;

const PROJECT_THUMB_WIDTH = 112;
const PROJECT_THUMB_HEIGHT = Math.round((PROJECT_THUMB_WIDTH * 9) / 16);

const SOFT_LINE = "var(--color-line-soft, #a9a9a9)";

/** Column widths are shared by the header rule and every row, so they align. */
const ColumnHeader: React.FC = () => (
  <div
    className="flex flex-row items-end"
    style={{
      gap: COLUMN_GAP + "px",
      paddingBottom: "8px",
      borderBottom: HAIRLINE + " solid var(--color-line, #000000)",
    }}
  >
    {[
      { label: "Preview", width: PREVIEW_WIDTH },
      { label: "Episode name", width: NAME_COLUMN_WIDTH },
      { label: "Tasks", width: null },
      { label: "Notes", width: NOTES_COLUMN_WIDTH },
    ].map((col) => (
      <span
        key={col.label}
        className={col.width === null ? "flex-1 min-w-0" : "shrink-0"}
        style={{
          width: col.width === null ? undefined : col.width + "px",
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink-muted, #707070)",
        }}
      >
        {col.label}
      </span>
    ))}
  </div>
);

type EpisodeRowProps = {
  episode: EpisodeV2;
  processes: ProcessProgress[];
  onOpenScenes: (episodeId: string) => void;
  onOpenManage: (episodeId: string) => void;
};

const EpisodeRow: React.FC<EpisodeRowProps> = ({
  episode,
  processes,
  onOpenScenes,
  onOpenManage,
}) => (
  <div
    className="flex flex-row items-start outline-none focus-visible:ring-1 focus-visible:ring-black"
    tabIndex={0}
    onDoubleClick={() => onOpenScenes(episode.id)}
    onKeyDown={(e) => {
      if (e.key === "Enter") onOpenScenes(episode.id);
    }}
    style={{
      gap: COLUMN_GAP + "px",
      paddingTop: ROW_PADDING_Y + "px",
      paddingBottom: ROW_PADDING_Y + "px",
      borderBottom: HAIRLINE + " solid " + SOFT_LINE,
    }}
  >
    {/*
      A div, not a button: the hover View control is a real button, and nesting
      one button inside another is invalid HTML.
    */}
    <div
      className="group relative shrink-0 overflow-hidden"
      style={{
        width: PREVIEW_WIDTH + "px",
        height: PREVIEW_HEIGHT + "px",
        backgroundColor: "var(--color-placeholder, #d9d9d9)",
        borderRadius: "var(--radius-sm, 3px)",
      }}
    >
      {episode.previewImage ? (
        <img
          src={episode.previewImage}
          alt={episode.episodeName}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: "var(--text-caption, 11px)",
            color: "var(--color-ink-muted, #707070)",
          }}
        >
          {episode.code || "No preview"}
        </span>
      )}

      <button
        type="button"
        onClick={() => onOpenManage(episode.id)}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 cursor-pointer opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 outline-none focus-visible:ring-1 focus-visible:ring-white"
        style={{
          backgroundColor: BOARD_ACCENT,
          color: "var(--color-canvas, #ffffff)",
          fontSize: "var(--text-caption, 11px)",
          borderRadius: "var(--radius-sm, 3px)",
        }}
      >
        View
      </button>
    </div>

    <div
      className="shrink-0 flex flex-col gap-1"
      style={{ width: NAME_COLUMN_WIDTH + "px" }}
    >
      <span
        style={{
          fontSize: "var(--text-body, 15px)",
          color: "var(--color-ink, #000000)",
        }}
      >
        {episode.episodeName}
      </span>
      {episode.description && (
        <span
          className="leading-snug"
          style={{
            fontSize: "var(--text-list, 12px)",
            color: "var(--color-ink-muted, #707070)",
          }}
        >
          {episode.description}
        </span>
      )}
    </div>

    {/* Cards wrap onto further lines rather than scrolling sideways. */}
    <div className="flex-1 min-w-0 flex flex-row flex-wrap gap-3">
      {processes.map((process) => (
        <ProcessCard key={process.processId} process={process} />
      ))}
    </div>

    <div
      className="shrink-0 self-stretch"
      style={{
        width: NOTES_COLUMN_WIDTH + "px",
        borderLeft: HAIRLINE + " solid " + SOFT_LINE,
      }}
    />
  </div>
);

export const EpisodeBoardView: React.FC<EpisodeBoardViewProps> = ({
  project,
  initialEpisodes,
  processProgress,
  initialError = null,
}) => {
  const router = useRouter();

  const [episodes, setEpisodes] = useState<EpisodeV2[]>(initialEpisodes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const visibleEpisodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter(
      (e) =>
        e.episodeName.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q)
    );
  }, [episodes, searchQuery]);

  const handleOpenScenes = useCallback(
    (episodeId: string) => {
      router.push("/projects/" + project.id + "/episodes/" + episodeId + "/scenes");
    },
    [router, project.id]
  );

  const handleOpenManage = useCallback(
    (episodeId: string) => {
      router.push("/projects/" + project.id + "/episodes/" + episodeId + "/manage");
    },
    [router, project.id]
  );

  const handleCreateEpisode = async (data: {
    projectId: string;
    episodeName: string;
    code?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    jobWorkflowId?: string;
    sceneWorkflowId?: string;
  }) => {
    const newEp = await createEpisodeV2(data);
    setEpisodes((prev) => [...prev, newEp]);
  };

  if (errorMsg) {
    return (
      <>
        <CanvasShell nav={null} tools={null}>
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-[var(--radius-card,7px)] p-8 max-w-md shadow-sm">
              <p className="text-[var(--text-section,18px)] text-[var(--color-ink)] font-medium mb-4">
                Error Loading Episodes
              </p>
              <p className="text-[var(--text-list,12px)] text-[var(--color-ink)] mb-6 opacity-90 leading-relaxed">
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-canvas)] text-[var(--text-caption,11px)] font-medium rounded-[var(--radius-sm,3px)] cursor-pointer hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        </CanvasShell>

        <BottomNav />
      </>
    );
  }

  return (
    <>
      <CanvasShell
        // Same arrangement ProjectBoardView uses: BottomNav is fixed to the
        // viewport's bottom-left while CanvasShell's nav slot is hard-positioned
        // top-right, so the slot is left empty and BottomNav renders as a
        // sibling rather than changing a slot every other page depends on.
        // This page has no transform tools, so that slot is empty too.
        nav={null}
        tools={null}
      >
        <div className="w-full h-full relative overflow-hidden flex flex-col">
          <div className="shrink-0 pt-[38px] px-[101.5px] pb-4">
            <BoardHeader
              createLabel="Create Episode"
              manageLabel="Manage Episode"
              onCreate={() => setIsCreateOpen(true)}
              // TODO: Manage Episode needs a selected episode to target, and
              // the header has no selection model yet — inert, as on the
              // Project board.
              onManage={() => {}}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div className="shrink-0 px-[101.5px] pb-5 flex flex-row items-center gap-4">
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: PROJECT_THUMB_WIDTH + "px",
                height: PROJECT_THUMB_HEIGHT + "px",
                backgroundColor: "var(--color-placeholder, #d9d9d9)",
                borderRadius: "var(--radius-sm, 3px)",
              }}
            >
              {project.thumbnailUrl && (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="min-w-0 flex flex-col gap-1">
              <span
                className="truncate"
                style={{
                  fontSize: "var(--text-section, 18px)",
                  fontWeight: 500,
                  color: "var(--color-ink, #000000)",
                }}
              >
                {project.title}
              </span>
              <span
                style={{
                  fontSize: "var(--text-caption, 11px)",
                  color: "var(--color-ink-muted, #707070)",
                }}
              >
                {project.projectCode}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-[101.5px] pb-[80px]">
            <ColumnHeader />

            {visibleEpisodes.length === 0 ? (
              <p
                className="pt-6"
                style={{
                  fontSize: "var(--text-list, 12px)",
                  color: "var(--color-ink-muted, #707070)",
                }}
              >
                {episodes.length === 0
                  ? "No episodes yet. Use Create Episode to add the first one."
                  : "No episodes match this search."}
              </p>
            ) : (
              visibleEpisodes.map((episode) => (
                <EpisodeRow
                  key={episode.id}
                  episode={episode}
                  processes={processProgress[episode.id] || []}
                  onOpenScenes={handleOpenScenes}
                  onOpenManage={handleOpenManage}
                />
              ))
            )}
          </div>

          <EpisodeFormDialog
            isOpen={isCreateOpen}
            projectId={project.id}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateEpisode}
          />
        </div>
      </CanvasShell>

      <BottomNav />
    </>
  );
};

export default EpisodeBoardView;
