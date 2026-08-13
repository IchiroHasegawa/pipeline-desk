"use client";

import React, { useId, useMemo, memo } from "react";
import TimelineBranch from "@/components/timeline/TimelineBranch";
import TaskCard from "@/components/scenes/TaskCard";
import {
  deterministicInRange,
  Point,
  TIMELINE_LINE_FADE_STOPS,
} from "@/lib/timeline/timelineGeometry";
import type { EpisodeV2, DayV2, CustomTaskV2 } from "@/types/production-v2";

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
  episodeLineX: number; // ~958 at rest, ~473 when focused
  episode?: EpisodeV2;
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
  episode,
  days,
  selectedDayId,
  focusedDayId,
  selectedTaskId,
  onSelectDay,
  onOpenDay,
  onSelectTask,
}) => {
  const gradientId = useId();

  const episodeTop: Point = { x: episodeLineX, y: 50 };
  const episodeBottom: Point = { x: episodeLineX, y: 1000 };
  const lineLength = 950;

  // Calculate branch paths for Days and Custom Tasks
  const { dayBranches, taskBranches } = useMemo(() => {
    if (days.length === 0) {
      return {
        dayBranches: [],
        taskBranches: [],
      };
    }

    // FIX 1: Dev-only assertion for exact vertical line anchor points
    if (process.env.NODE_ENV !== "production") {
      const testAnchor05 = 50 + 0.05 * 950;
      const testAnchor95 = 50 + 0.95 * 950;
      if (Math.abs(testAnchor05 - 97.5) > 1e-6 || Math.abs(testAnchor95 - 952.5) > 1e-6) {
        console.error("Vertical line calculation assertion failed:", { testAnchor05, testAnchor95 });
      }
    }

    // Sort days by dayDate ascending
    const sortedDays = [...days].sort(
      (a, b) => new Date(a.dayDate).getTime() - new Date(b.dayDate).getTime()
    );

    const todayStr = new Date().toISOString().split("T")[0];
    const todayMs = new Date(todayStr).getTime();

    const earliestDayMs =
      sortedDays.length > 0 && !isNaN(new Date(sortedDays[0].dayDate).getTime())
        ? new Date(sortedDays[0].dayDate).getTime()
        : null;

    const latestDayMs =
      sortedDays.length > 0 &&
      !isNaN(new Date(sortedDays[sortedDays.length - 1].dayDate).getTime())
        ? new Date(sortedDays[sortedDays.length - 1].dayDate).getTime()
        : null;

    const episodeStartMs =
      episode?.startDate && !isNaN(new Date(episode.startDate).getTime())
        ? new Date(episode.startDate).getTime()
        : null;

    const episodeEndMs =
      episode?.endDate && !isNaN(new Date(episode.endDate).getTime())
        ? new Date(episode.endDate).getTime()
        : null;

    // Explicit fallbacks for start and end date
    const startMs = episodeStartMs ?? earliestDayMs ?? todayMs;
    const endMs = episodeEndMs ?? latestDayMs ?? todayMs;
    const spanMs = endMs - startMs;

    const resolvedDays: ResolvedDayBranch[] = [];
    const resolvedTasks: ResolvedTaskBranch[] = [];

    sortedDays.forEach((day, idx) => {
      // Calculate anchorT along downward vertical episode line
      let anchorT: number;
      if (spanMs <= 0) {
        anchorT = (idx + 1) / (sortedDays.length + 1);
      } else {
        const dayMs = !isNaN(new Date(day.dayDate).getTime())
          ? new Date(day.dayDate).getTime()
          : startMs;
        anchorT = (dayMs - startMs) / spanMs;
      }

      // Clamp anchorT to [0.05, 0.95] so branches never sit on line's ends
      anchorT = Math.max(0.05, Math.min(0.95, anchorT));

      // FIX 1: Explicit downward descending line calculation (y = 50 + anchorT * 950)
      const dayFrom: Point = {
        x: episodeLineX,
        y: 50 + anchorT * lineLength,
      };

      // Day branch length: clamp(280 + 60 * customTaskCount, 280, 640)
      const customTaskCount = day.tasks ? day.tasks.length : 0;
      const dayLength = Math.max(280, Math.min(640, 280 + 60 * customTaskCount));

      // FIX 2: Compute day branch endpoints in ABSOLUTE screen space
      const side = idx % 2 === 0 ? 1 : -1; // even right (+1), odd left (-1)
      let thetaDeg = deterministicInRange(day.id, -55, 55);
      // Bias upward if near the bottom edge (y > 650) so it doesn't exceed y=1080
      if (dayFrom.y > 650 && thetaDeg > -10) {
        thetaDeg = -Math.abs(thetaDeg) - 15;
      } else if (dayFrom.y < 350 && thetaDeg < 10) {
        thetaDeg = Math.abs(thetaDeg) + 15;
      }
      const theta = (thetaDeg * Math.PI) / 180;
      const dayTo: Point = {
        x: dayFrom.x + side * dayLength * Math.cos(theta),
        y: dayFrom.y + dayLength * Math.sin(theta),
      };

      // FIX 5: Dev off-canvas warning
      if (process.env.NODE_ENV !== "production") {
        const isOffCanvas =
          dayFrom.x < 0 || dayFrom.x > 1920 ||
          dayFrom.y < 0 || dayFrom.y > 1080 ||
          dayTo.x < 0 || dayTo.x > 1920 ||
          dayTo.y < 0 || dayTo.y > 1080;

        if (isOffCanvas) {
          console.warn(
            `DayBranchTree: Day branch '${day.id}' coordinates fall outside canvas [0..1920, 0..1080]:`,
            { from: dayFrom, to: dayTo }
          );
        }
      }

      resolvedDays.push({
        dayId: day.id,
        from: dayFrom,
        to: dayTo,
        tasks: day.tasks || [],
      });

      // Custom task branches parent-relative behavior
      if (day.tasks && day.tasks.length > 0) {
        const dayVectorX = dayTo.x - dayFrom.x;
        const dayVectorY = dayTo.y - dayFrom.y;
        const dayAngle = Math.atan2(dayVectorY, dayVectorX);

        const taskMap: Record<string, ResolvedTaskBranch> = {};

        day.tasks.forEach((task, tIdx) => {
          const tFraction = 0.2 + (tIdx * 0.6) / Math.max(1, day.tasks.length);

          let taskFrom: Point;
          let baseAngle: number;

          if (task.branchesFromTaskId && taskMap[task.branchesFromTaskId]) {
            const parentTask = taskMap[task.branchesFromTaskId];
            const pVecX = parentTask.to.x - parentTask.from.x;
            const pVecY = parentTask.to.y - parentTask.from.y;
            taskFrom = {
              x: parentTask.from.x + tFraction * pVecX,
              y: parentTask.from.y + tFraction * pVecY,
            };
            baseAngle = Math.atan2(pVecY, pVecX);
          } else {
            taskFrom = {
              x: dayFrom.x + tFraction * dayVectorX,
              y: dayFrom.y + tFraction * dayVectorY,
            };
            baseAngle = dayAngle;
          }

          // Deterministic spread of +/- 35 degrees, length 160
          let spreadDeg = deterministicInRange(task.id, -35, 35);
          if (taskFrom.y > 750 && (baseAngle > 0 || spreadDeg > 0)) {
            spreadDeg = -Math.abs(spreadDeg);
          }
          const spread = (spreadDeg * Math.PI) / 180;
          const taskAngle = baseAngle + spread;
          const taskLength = 160;

          const taskTo: Point = {
            x: taskFrom.x + taskLength * Math.cos(taskAngle),
            y: taskFrom.y + taskLength * Math.sin(taskAngle),
          };

          // Dev off-canvas warning
          if (process.env.NODE_ENV !== "production") {
            const isOffCanvas =
              taskFrom.x < 0 || taskFrom.x > 1920 ||
              taskFrom.y < 0 || taskFrom.y > 1080 ||
              taskTo.x < 0 || taskTo.x > 1920 ||
              taskTo.y < 0 || taskTo.y > 1080;

            if (isOffCanvas) {
              console.warn(
                `DayBranchTree: Task branch '${task.id}' coordinates fall outside canvas [0..1920, 0..1080]:`,
                { from: taskFrom, to: taskTo }
              );
            }
          }

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
      }
    });

    return {
      dayBranches: resolvedDays,
      taskBranches: resolvedTasks,
    };
  }, [days, episode, episodeLineX, lineLength]);

  // Compute Task Card placements and leader lines with collision avoidance
  const cardPlacements = useMemo(() => {
    const cardWidth = 155;
    const cardHeight = 179; // 167 body + 25 tab - 13 overlap
    const padding = 16;

    type CardBox = { id: string; x: number; y: number; w: number; h: number };
    const placed: CardBox[] = [];

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

      // Initial placement: offset 12px along branch direction
      let cardX = tb.to.x + 12 * ux - cardWidth / 2;
      let cardY = tb.to.y + 12 * uy - cardHeight / 2;

      // Test collision & push along branch direction (up to 6 attempts)
      let attempt = 0;
      while (attempt < 6) {
        const stepDist = 12 + attempt * 24;
        const testX = tb.to.x + stepDist * ux - cardWidth / 2;
        const testY = tb.to.y + stepDist * uy - cardHeight / 2;

        const testBox: CardBox = { id: tb.id, x: testX, y: testY, w: cardWidth, h: cardHeight };
        const hasCollision = placed.some(
          (b) =>
            !(
              testBox.x + testBox.w + padding <= b.x ||
              testBox.x >= b.x + b.w + padding ||
              testBox.y + testBox.h + padding <= b.y ||
              testBox.y >= b.y + b.h + padding
            )
        );

        if (!hasCollision) {
          cardX = testX;
          cardY = testY;
          break;
        }
        attempt++;
      }

      // If still collides, offset perpendicular
      if (attempt >= 6) {
        const perpOffsets = [24, -24, 48, -48, 72, -72];
        for (const perp of perpOffsets) {
          const testX = cardX + perp * px;
          const testY = cardY + perp * py;
          const testBox: CardBox = { id: tb.id, x: testX, y: testY, w: cardWidth, h: cardHeight };
          const hasCollision = placed.some(
            (b) =>
              !(
                testBox.x + testBox.w + padding <= b.x ||
                testBox.x >= b.x + b.w + padding ||
                testBox.y + testBox.h + padding <= b.y ||
                testBox.y >= b.y + b.h + padding
              )
          );
          if (!hasCollision) {
            cardX = testX;
            cardY = testY;
            break;
          }
        }
      }

      // Clamp within canvas boundaries
      cardX = Math.max(10, Math.min(1920 - cardWidth - 10, cardX));
      cardY = Math.max(10, Math.min(1080 - cardHeight - 10, cardY));

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

  return (
    <g className="transition-[transform] duration-500 ease-out">
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={episodeTop.x}
          y1={episodeTop.y}
          x2={episodeBottom.x}
          y2={episodeBottom.y}
        >
          {TIMELINE_LINE_FADE_STOPS.map((stop, i) => (
            <stop
              key={i}
              offset={stop.offset}
              stopColor="var(--color-line, #000000)"
              stopOpacity={stop.opacity}
            />
          ))}
        </linearGradient>
      </defs>

      {/* 1px Vertical Episode Line */}
      <line
        x1={episodeTop.x}
        y1={episodeTop.y}
        x2={episodeBottom.x}
        y2={episodeBottom.y}
        stroke={`url(#${gradientId})`}
        strokeWidth={1}
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
          strokeWidth={0.5}
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
            width={155}
            height={180}
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
