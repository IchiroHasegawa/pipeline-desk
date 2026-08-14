"use client";

import React, { useId, useMemo, memo } from "react";
import TimelineBranch from "@/components/timeline/TimelineBranch";
import TaskCard from "@/components/scenes/TaskCard";
import {
  deterministicInRange,
  Point,
  TIMELINE_LINE_FADE_STOPS,
  sceneBranchSpec,
  sceneLineExtent,
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
  episodeLineX: number; // 957.8 at rest, 473.2 when focused (DESIGN_SPEC §7)
  zoom: number; // 1 at rest, SCENE_ZOOM_FOCUS when a day is focused
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
  zoom,
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

  // DESIGN_SPEC §7: two contiguous segments meeting at y 384, lengths scaled by zoom.
  const { top: lineTop, bottom: lineBottom } = sceneLineExtent(zoom);
  const episodeTop: Point = { x: episodeLineX, y: lineTop };
  const episodeBottom: Point = { x: episodeLineX, y: lineBottom };
  const lineLength = lineBottom - lineTop;

  // Calculate branch paths for Days and Custom Tasks
  const { dayBranches, taskBranches } = useMemo(() => {
    if (days.length === 0) {
      return {
        dayBranches: [],
        taskBranches: [],
      };
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

      // Anchor along the downward vertical episode line
      const dayFrom: Point = {
        x: episodeLineX,
        y: lineTop + anchorT * lineLength,
      };

      // DESIGN_SPEC §7: angle 32°–47.15° and rest length 139–411.3, both derived
      // deterministically from the day id. Angle is constant across zoom states;
      // only the length scales.
      const { angleDeg, restLength } = sceneBranchSpec(day.id);
      const dayLength = restLength * zoom;

      const side = idx % 2 === 0 ? 1 : -1; // even right (+1), odd left (-1)
      const theta = (angleDeg * Math.PI) / 180;
      const dx = side * dayLength * Math.cos(theta);
      const dy = dayLength * Math.sin(theta);

      // Branches run downward. Mirror vertically (preserving the angle magnitude)
      // when a downward branch would leave the canvas.
      const vSign = dayFrom.y + dy > 1060 ? -1 : 1;

      const dayTo: Point = {
        x: dayFrom.x + dx,
        y: dayFrom.y + vSign * dy,
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
          const taskLength = 160 * zoom;

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
  }, [days, episode, episodeLineX, zoom, lineTop, lineLength]);

  // Compute Task Card placements and leader lines with collision avoidance
  const cardPlacements = useMemo(() => {
    // DESIGN_SPEC §7 task card frame
    const cardWidth = 217.7;
    const cardHeight = 235.6;
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
