"use client";

import React, { useMemo, memo } from "react";
import TimelineBranch from "@/components/timeline/TimelineBranch";
import TaskCard from "@/components/scenes/TaskCard";
import {
  deterministicInRange,
  getAttachmentPoint,
  resolveAttachmentGap,
  sceneBranchSpec,
  sceneLineExtent,
  clamp,
  DAY_ATTACH_START_RATIO,
  DAY_ATTACH_GAP_RATIO,
  TASK_ATTACH_START_RATIO,
  TASK_ATTACH_GAP_RATIO,
  LINE_STROKE_WIDTH,
  BRANCH_STROKE_WIDTH,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  Point,
  LineSegment,
} from "@/lib/timeline/timelineGeometry";
import type { DayV2, CustomTaskV2 } from "@/types/production-v2";

/**
 * The bottom scene-card rail, in world units — DESIGN_SPEC §5 episode
 * strip, which the Scene page reuses: 1180 × 82 at (335.5, 937), plus the
 * shadow. Task cards are kept clear of this band (§4).
 */
const SCENE_RAIL_TOP = 925;

/** DESIGN_SPEC §7 task card frame. */
const CARD_WIDTH = 217.7;
const CARD_HEIGHT = 235.6;
const CARD_PADDING = 16;

export type DayWithTasks = DayV2 & { tasks: CustomTaskV2[] };

export type ResolvedDayBranch = {
  dayId: string;
  from: Point;
  to: Point;
  tasks: CustomTaskV2[];
};

export type ResolvedTaskBranch = {
  id: string;
  dayId: string;
  from: Point;
  to: Point;
  task: CustomTaskV2;
};

export type DayBranchTreeProps = {
  episodeLineX: number; // 957.8 at rest, 473.2 when focused (DESIGN_SPEC §7)
  zoom: number; // 1 at rest, SCENE_ZOOM_FOCUS when a day is focused
  days: DayWithTasks[];
  selectedDayId: string | null;
  focusedDayId: string | null;
  selectedTaskId: string | null;
  onSelectDay: (id: string) => void;
  onOpenDay: (id: string) => void;
  onSelectTask: (id: string) => void;
};

export const DayBranchTreeComponent: React.FC<DayBranchTreeProps> = ({
  episodeLineX,
  zoom,
  days,
  selectedDayId,
  focusedDayId,
  selectedTaskId,
  onSelectDay,
  onOpenDay,
  onSelectTask,
}) => {
  // DESIGN_SPEC §7: two contiguous segments meeting at y 384, lengths scaled by zoom.
  const { top: lineTop, bottom: lineBottom } = sceneLineExtent(zoom);
  const episodeTop: Point = { x: episodeLineX, y: lineTop };
  const episodeBottom: Point = { x: episodeLineX, y: lineBottom };
  const episodeSegment: LineSegment = useMemo(
    () => ({
      x1: episodeTop.x,
      y1: episodeTop.y,
      x2: episodeBottom.x,
      y2: episodeBottom.y,
    }),
    [episodeTop.x, episodeTop.y, episodeBottom.x, episodeBottom.y]
  );

  // Calculate branch paths for Days and Custom Tasks
  const { dayBranches, taskBranches } = useMemo(() => {
    if (days.length === 0) {
      return { dayBranches: [], taskBranches: [] };
    }

    // Sort days by dayDate ascending so the order along the line is stable.
    const sortedDays = [...days].sort(
      (a, b) => new Date(a.dayDate).getTime() - new Date(b.dayDate).getTime()
    );

    const resolvedDays: ResolvedDayBranch[] = [];
    const resolvedTasks: ResolvedTaskBranch[] = [];

    // §4 — day junctions come from the same helper and the same approach as
    // the Episode page's episode-to-project-line attachment, driven by
    // DAY_ATTACH_*. Dates previously drove this, which is what pushed
    // junctions off the line whenever an episode's span was missing or
    // degenerate.
    const dayGap = resolveAttachmentGap(
      sortedDays.length,
      DAY_ATTACH_START_RATIO,
      DAY_ATTACH_GAP_RATIO
    );

    sortedDays.forEach((day, idx) => {
      const dayFrom = getAttachmentPoint(
        episodeSegment,
        idx,
        DAY_ATTACH_START_RATIO,
        dayGap
      );

      // DESIGN_SPEC §7: angle 32°–47.15°, rest length 139–411.3, both
      // deterministic from the day id. Angle is constant across zoom
      // states; only the length scales.
      const { angleDeg, restLength } = sceneBranchSpec(day.id);
      const dayLength = restLength * zoom;

      const side = idx % 2 === 0 ? 1 : -1; // even right, odd left
      const theta = (angleDeg * Math.PI) / 180;
      const dx = side * dayLength * Math.cos(theta);
      const dy = dayLength * Math.sin(theta);

      // Branches run downward, but must clear the scene-card rail rather
      // than plunging through it. Mirror upward when they would.
      const vSign = dayFrom.y + dy > SCENE_RAIL_TOP - CARD_HEIGHT * 0.5 ? -1 : 1;

      const dayTo: Point = { x: dayFrom.x + dx, y: dayFrom.y + vSign * dy };

      resolvedDays.push({
        dayId: day.id,
        from: dayFrom,
        to: dayTo,
        tasks: day.tasks || [],
      });

      if (!day.tasks || day.tasks.length === 0) return;

      const daySegment: LineSegment = {
        x1: dayFrom.x,
        y1: dayFrom.y,
        x2: dayTo.x,
        y2: dayTo.y,
      };
      const dayAngle = Math.atan2(dayTo.y - dayFrom.y, dayTo.x - dayFrom.x);

      const taskGap = resolveAttachmentGap(
        day.tasks.length,
        TASK_ATTACH_START_RATIO,
        TASK_ATTACH_GAP_RATIO
      );

      const taskMap: Record<string, ResolvedTaskBranch> = {};

      day.tasks.forEach((task, tIdx) => {
        // Tasks attach along their parent — the day branch normally, or
        // another task when one explicitly branches off it — using the
        // same helper again, so all three levels share one implementation.
        const parentTask = task.branchesFromTaskId
          ? taskMap[task.branchesFromTaskId]
          : undefined;

        const parentSegment: LineSegment = parentTask
          ? {
              x1: parentTask.from.x,
              y1: parentTask.from.y,
              x2: parentTask.to.x,
              y2: parentTask.to.y,
            }
          : daySegment;

        const baseAngle = parentTask
          ? Math.atan2(
              parentTask.to.y - parentTask.from.y,
              parentTask.to.x - parentTask.from.x
            )
          : dayAngle;

        const taskFrom = getAttachmentPoint(
          parentSegment,
          tIdx,
          TASK_ATTACH_START_RATIO,
          taskGap
        );

        let spreadDeg = deterministicInRange(task.id, -35, 35);
        const taskLength = 160 * zoom;

        // Steer away from the rail before committing to the angle, so the
        // card that hangs off this endpoint has somewhere legal to sit.
        const wouldHitRail =
          taskFrom.y + taskLength * Math.sin(baseAngle + (spreadDeg * Math.PI) / 180) >
          SCENE_RAIL_TOP - CARD_HEIGHT * 0.5;
        if (wouldHitRail) spreadDeg = -Math.abs(spreadDeg);

        const taskAngle = baseAngle + (spreadDeg * Math.PI) / 180;

        const taskTo: Point = {
          x: taskFrom.x + taskLength * Math.cos(taskAngle),
          y: taskFrom.y + taskLength * Math.sin(taskAngle),
        };

        const resolvedTask: ResolvedTaskBranch = {
          id: task.id,
          dayId: day.id,
          from: taskFrom,
          to: taskTo,
          task,
        };

        taskMap[task.id] = resolvedTask;
        resolvedTasks.push(resolvedTask);
      });
    });

    return { dayBranches: resolvedDays, taskBranches: resolvedTasks };
  }, [days, episodeSegment, zoom]);

  // Compute Task Card placements and leader lines with collision avoidance
  const cardPlacements = useMemo(() => {
    const cardWidth = CARD_WIDTH;
    const cardHeight = CARD_HEIGHT;
    const padding = CARD_PADDING;

    // §4 — a card may never overlap the scene-card rail. This is the hard
    // floor every candidate position is tested against.
    const maxCardY = SCENE_RAIL_TOP - cardHeight - padding;

    type CardBox = { id: string; x: number; y: number; w: number; h: number };
    const placed: CardBox[] = [];

    const collides = (box: CardBox): boolean =>
      placed.some(
        (b) =>
          !(
            box.x + box.w + padding <= b.x ||
            box.x >= b.x + b.w + padding ||
            box.y + box.h + padding <= b.y ||
            box.y >= b.y + b.h + padding
          )
      );

    const taskNameMap: Record<string, string> = {};
    days.forEach((d) => {
      d.tasks.forEach((t) => {
        taskNameMap[t.id] = t.name;
      });
    });

    return taskBranches.map((tb) => {
      const dx = tb.to.x - tb.from.x;
      const dy = tb.to.y - tb.from.y;
      const length = Math.hypot(dx, dy) || 1;
      const ux = dx / length;
      const uy = dy / length;
      const px = -uy;
      const py = ux;

      // The card hangs off the branch endpoint. §4 says to offset ALONG
      // the line rather than allow an overlap, so every candidate walks
      // further out along the branch direction first; only once that is
      // exhausted does it step sideways.
      let cardX = tb.to.x + 12 * ux - cardWidth / 2;
      let cardY = tb.to.y + 12 * uy - cardHeight / 2;
      let settled = false;

      for (let attempt = 0; attempt < 8 && !settled; attempt++) {
        const stepDist = 12 + attempt * 24;
        const testX = tb.to.x + stepDist * ux - cardWidth / 2;
        const testY = tb.to.y + stepDist * uy - cardHeight / 2;
        const box: CardBox = { id: tb.id, x: testX, y: testY, w: cardWidth, h: cardHeight };

        if (!collides(box) && testY <= maxCardY) {
          cardX = testX;
          cardY = testY;
          settled = true;
        }
      }

      if (!settled) {
        for (const perp of [24, -24, 48, -48, 72, -72, 96, -96]) {
          const testX = cardX + perp * px;
          const testY = cardY + perp * py;
          const box: CardBox = { id: tb.id, x: testX, y: testY, w: cardWidth, h: cardHeight };
          if (!collides(box) && testY <= maxCardY) {
            cardX = testX;
            cardY = testY;
            settled = true;
            break;
          }
        }
      }

      // Clamp within the canvas, and above the rail. The rail clamp is
      // applied last so it always wins.
      cardX = clamp(cardX, 10, WORLD_WIDTH - cardWidth - 10);
      cardY = clamp(cardY, 10, Math.min(WORLD_HEIGHT - cardHeight - 10, maxCardY));

      placed.push({ id: tb.id, x: cardX, y: cardY, w: cardWidth, h: cardHeight });

      // Nearest point on card boundary rect to branch endpoint
      const nearestX = Math.max(cardX, Math.min(tb.to.x, cardX + cardWidth));
      const nearestY = Math.max(cardY, Math.min(tb.to.y, cardY + cardHeight));

      const rawContribId = tb.task.contributesToTaskId;
      const contribName = rawContribId ? (taskNameMap[rawContribId] || rawContribId) : null;

      return {
        tb,
        x: cardX,
        y: cardY,
        leaderFrom: tb.to,
        leaderTo: { x: nearestX, y: nearestY },
        contributesToName: contribName && contribName !== "None" ? contribName : null,
      };
    });
  }, [taskBranches, days]);

  /*
   * At focus the line is 3.15× longer than the 1080 canvas, so the focused day's
   * anchor has to be brought back into view. DESIGN_SPEC does not specify panning
   * (§7 gives only the zoomed lengths), so this centres the focused anchor
   * vertically — an implementation decision, not a measured value.
   */
  const panY = useMemo(() => {
    if (focusedDayId === null) return 0;
    const focused = dayBranches.find((b) => b.dayId === focusedDayId);
    return focused ? 540 - focused.from.y : 0;
  }, [focusedDayId, dayBranches]);

  return (
    <g
      className="transition-transform duration-500 ease-out"
      transform={`translate(0, ${panY})`}
    >
      {/* The vertical episode spine — 1px, SOLID.
          §3.5: the endpoint fade is exclusive to the project line, and this
          is an episode line, so it carries no gradient. Reference images 8
          and 9 show it as a uniform stroke. */}
      <line
        x1={episodeTop.x}
        y1={episodeTop.y}
        x2={episodeBottom.x}
        y2={episodeBottom.y}
        stroke="var(--color-line, #000000)"
        strokeWidth={LINE_STROKE_WIDTH}
        strokeLinecap="round"
        className="pointer-events-none transition-[x1,x2] duration-500 ease-out"
      />

      {/* Render Day Branches */}
      {dayBranches.map(({ dayId, from, to }) => {
        const isSelected = dayId === selectedDayId;
        const isFocused = dayId === focusedDayId;
        const isDimmed = focusedDayId !== null && !isFocused;

        return (
          <TimelineBranch
            key={dayId}
            id={dayId}
            from={from}
            to={to}
            selected={isSelected || isFocused}
            dimmed={isDimmed}
            onSelect={onSelectDay}
            onOpen={onOpenDay}
          />
        );
      })}

      {/* Render Custom Task Branches */}
      {taskBranches.map((tb) => {
        const isSelected = tb.id === selectedTaskId;
        const isDimmed = focusedDayId !== null && tb.dayId !== focusedDayId;

        return (
          <TimelineBranch
            key={tb.id}
            id={tb.id}
            from={tb.from}
            to={tb.to}
            selected={isSelected}
            dimmed={isDimmed}
            onSelect={onSelectTask}
          />
        );
      })}

      {/* 0.5px Leader Lines from branch endpoints to nearest card edges */}
      {cardPlacements.map(({ tb, leaderFrom, leaderTo }) => (
        <line
          key={`leader-${tb.id}`}
          x1={leaderFrom.x}
          y1={leaderFrom.y}
          x2={leaderTo.x}
          y2={leaderTo.y}
          stroke="var(--color-line, #000000)"
          strokeWidth={BRANCH_STROKE_WIDTH}
          className="pointer-events-none"
        />
      ))}

      {/* Render Task Cards at non-overlapping computed positions */}
      {cardPlacements.map(({ tb, x, y, contributesToName }) => {
        const isSelected = tb.id === selectedTaskId;

        return (
          <foreignObject
            key={tb.id}
            x={x}
            y={y}
            width={217.7}
            height={235.6}
            className="overflow-visible pointer-events-none"
          >
            <TaskCard
              id={tb.id}
              title={tb.task.name}
              contributesToTaskName={contributesToName}
              selected={isSelected}
              onSelect={onSelectTask}
            />
          </foreignObject>
        );
      })}
    </g>
  );
};

export const DayBranchTree = memo(DayBranchTreeComponent);
export default DayBranchTree;
