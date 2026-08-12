"use client";

import React, { useId, useMemo, memo } from "react";
import TimelineBranch from "@/components/timeline/TimelineBranch";
import TaskCard from "@/components/scenes/TaskCard";
import {
  resolveBranchPaths,
  BranchSpec,
  Point,
  TIMELINE_LINE_FADE_STOPS,
} from "@/lib/timeline/timelineGeometry";
import type { DayV2, CustomTaskV2 } from "@/types/production-v2";

export type DayWithTasks = DayV2 & { tasks: CustomTaskV2[] };

export type DayBranchTreeProps = {
  episodeLineX: number; // ~958 at rest, ~473 when focused
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

  // Calculate branch specs for Days and Custom Tasks
  const { dayBranches, taskAnchorsMap } = useMemo(() => {
    const topPt: Point = { x: episodeLineX, y: 50 };
    if (days.length === 0) {
      return {
        dayBranches: [],
        taskAnchorsMap: {},
      };
    }

    // Sort days by dayDate
    const sortedDays = [...days].sort(
      (a, b) => new Date(a.dayDate).getTime() - new Date(b.dayDate).getTime()
    );

    const minTime = new Date(sortedDays[0].dayDate).getTime();
    const maxTime = new Date(sortedDays[sortedDays.length - 1].dayDate).getTime();
    const span = Math.max(1, maxTime - minTime);

    // Angles array for Day branches
    const dayAngles = [-35, 35, -50, 50, -25, 40];

    const allDayResolved: Array<{
      dayId: string;
      path: { id: string; from: Point; to: Point; depth: number };
      tasks: CustomTaskV2[];
    }> = [];

    const taskAnchors: Record<string, { endpoint: Point; task: CustomTaskV2 }> = {};

    sortedDays.forEach((day, idx) => {
      let anchorT = (idx + 1) / (sortedDays.length + 1);
      if (span > 0 && days.length > 1) {
        const dTime = new Date(day.dayDate).getTime();
        anchorT = 0.08 + 0.84 * ((dTime - minTime) / span);
      }

      const angleDeg = dayAngles[idx % dayAngles.length];
      const length = 220;

      // Vertical line angle is 90° (downward)
      const daySpec: BranchSpec = {
        id: day.id,
        anchorT,
        angleDeg,
        length,
      };

      const resolvedDays = resolveBranchPaths(topPt, lineLength, [daySpec], 90);
      if (resolvedDays.length > 0) {
        const dayPath = resolvedDays[0];
        allDayResolved.push({
          dayId: day.id,
          path: dayPath,
          tasks: day.tasks || [],
        });

        // Resolve custom task branches for this day
        if (day.tasks && day.tasks.length > 0) {
          const taskAngles = [25, -30, 40, -45, 20];
          const taskSpecs: BranchSpec[] = day.tasks.map((task, tIdx) => ({
            id: task.id,
            anchorT: 0.2 + (tIdx * 0.6) / Math.max(1, day.tasks.length),
            angleDeg: taskAngles[tIdx % taskAngles.length],
            length: 120,
            parentBranchId: task.branchesFromTaskId || undefined,
          }));

          // Compute task branch paths off the Day line
          const resolvedTasks = resolveBranchPaths(
            dayPath.from,
            Math.hypot(dayPath.to.x - dayPath.from.x, dayPath.to.y - dayPath.from.y),
            taskSpecs,
            angleDeg + 90
          );

          resolvedTasks.forEach((rt) => {
            const taskObj = day.tasks.find((t) => t.id === rt.id);
            if (taskObj) {
              taskAnchors[rt.id] = {
                endpoint: rt.to,
                task: taskObj,
              };
            }
          });
        }
      }
    });

    return {
      dayBranches: allDayResolved,
      taskAnchorsMap: taskAnchors,
    };
  }, [days, episodeLineX, lineLength]);

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

      {/* Render Day Branches and Custom Task Branches */}
      {dayBranches.map(({ dayId, path }) => {
        const isSelected = dayId === selectedDayId;
        const isFocused = dayId === focusedDayId;
        const isDimmed = focusedDayId !== null && !isFocused;

        return (
          <TimelineBranch
            key={dayId}
            id={dayId}
            from={path.from}
            to={path.to}
            selected={isSelected || isFocused}
            dimmed={isDimmed}
            onSelect={onSelectDay}
            onOpen={onOpenDay}
          />
        );
      })}

      {/* Render Task Cards near branch endpoints */}
      {Object.entries(taskAnchorsMap).map(([taskId, { endpoint, task }]) => {
        const isSelected = taskId === selectedTaskId;

        return (
          <foreignObject
            key={taskId}
            x={endpoint.x}
            y={endpoint.y - 40}
            width={200}
            height={200}
            className="overflow-visible pointer-events-none"
          >
            <TaskCard
              id={taskId}
              title={task.name}
              description={`Contributes to task: ${task.contributesToTaskId || "None"}`}
              selected={isSelected}
              anchor={{ x: 0, y: 40 }}
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
