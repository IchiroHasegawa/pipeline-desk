export const TIMELINE_ANGLE_DEG = 22;

export type Point = { x: number; y: number };

export type GradientStop = { offset: string; opacity: number };

export const TIMELINE_LINE_FADE_STOPS: GradientStop[] = [
  { offset: "0%", opacity: 0 },
  { offset: "8%", opacity: 0.15 },
  { offset: "22%", opacity: 0.65 },
  { offset: "37%", opacity: 1.00 },
  { offset: "52%", opacity: 0.85 },
  { offset: "68%", opacity: 0.40 },
  { offset: "85%", opacity: 0.08 },
  { offset: "100%", opacity: 0 },
];

/** Endpoint of a line of `length` starting at `origin`, ascending right at the given angle. */
export function lineEndpoint(
  origin: Point,
  length: number,
  angleDeg: number = TIMELINE_ANGLE_DEG
): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: origin.x + length * Math.cos(rad),
    y: origin.y - length * Math.sin(rad),
  };
}

/** Point at fraction t (0..1) along the line. Used to anchor episode branches. */
export function pointAlongLine(
  origin: Point,
  length: number,
  t: number,
  angleDeg: number = TIMELINE_ANGLE_DEG
): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: origin.x + clampedT * length * Math.cos(rad),
    y: origin.y - clampedT * length * Math.sin(rad),
  };
}

/** Stacking transform for depth. index 0 = newest = frontmost. */
export function depthTransform(
  index: number,
  _total: number
): {
  scale: number; // 1.0 down to ~0.82
  offsetY: number; // px pushed back/up
  opacity: number; // 1.0 down to ~0.25
  blurPx: number; // 0 up to ~2.5
} {
  void _total;
  const clampedIdx = Math.min(Math.max(0, index), 8);
  const factor = clampedIdx / 8;

  return {
    scale: 1.0 - factor * 0.18,
    offsetY: -clampedIdx * 18,
    opacity: 1.0 - factor * 0.75,
    blurPx: factor * 2.5,
  };
}

export type BranchSpec = {
  id: string;
  /** 0..1 — where along the parent line this branch attaches */
  anchorT: number;
  /** degrees; 0 = same direction as parent, positive = counter-clockwise */
  angleDeg: number;
  length: number;
  /** id of another branch to attach to instead of the parent */
  parentBranchId?: string;
};

export type ResolvedBranchPath = {
  id: string;
  from: Point;
  to: Point;
  depth: number;
};

export function resolveBranchPaths(
  parentOrigin: Point,
  parentLength: number,
  branches: BranchSpec[],
  parentAngleDeg: number = TIMELINE_ANGLE_DEG
): ResolvedBranchPath[] {
  type ResolvedInternal = ResolvedBranchPath & { absAngle: number };
  const resolvedMap: Record<string, ResolvedInternal> = {};
  const remaining = [...branches];

  // Resolve in passes until no progress or max iterations reached
  let progress = true;
  let iterations = 0;
  const maxIterations = branches.length + 1;

  while (remaining.length > 0 && progress && iterations < maxIterations) {
    progress = false;
    iterations++;

    for (let i = remaining.length - 1; i >= 0; i--) {
      const branch = remaining[i];

      if (!branch.parentBranchId) {
        // Direct branch attached to parent line
        const anchorPt = pointAlongLine(
          parentOrigin,
          parentLength,
          branch.anchorT,
          parentAngleDeg
        );
        const branchAbsAngle = parentAngleDeg + branch.angleDeg;
        const endpoint = lineEndpoint(anchorPt, branch.length, branchAbsAngle);

        const resolved: ResolvedInternal = {
          id: branch.id,
          from: anchorPt,
          to: endpoint,
          depth: 0,
          absAngle: branchAbsAngle,
        };

        resolvedMap[branch.id] = resolved;
        remaining.splice(i, 1);
        progress = true;
      } else if (resolvedMap[branch.parentBranchId]) {
        // Sub-branch attached to a parent branch
        const parentRes = resolvedMap[branch.parentBranchId];
        const pLen = Math.hypot(
          parentRes.to.x - parentRes.from.x,
          parentRes.to.y - parentRes.from.y
        );

        const anchorPt = pointAlongLine(
          parentRes.from,
          pLen,
          branch.anchorT,
          parentRes.absAngle
        );
        const branchAbsAngle = parentRes.absAngle + branch.angleDeg;
        const endpoint = lineEndpoint(anchorPt, branch.length, branchAbsAngle);

        const resolved: ResolvedInternal = {
          id: branch.id,
          from: anchorPt,
          to: endpoint,
          depth: parentRes.depth + 1,
          absAngle: branchAbsAngle,
        };

        resolvedMap[branch.id] = resolved;
        remaining.splice(i, 1);
        progress = true;
      }
    }
  }

  return Object.values(resolvedMap).map(({ id, from, to, depth }) => ({
    id,
    from,
    to,
    depth,
  }));
}
