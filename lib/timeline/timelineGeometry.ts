export const TIMELINE_ANGLE_DEG = 22.5;

export type Point = { x: number; y: number };

export type GradientStop = { offset: string; opacity: number };

export const TIMELINE_LINE_FADE_STOPS: GradientStop[] = [
  { offset: "0%", opacity: 0.00 },
  { offset: "8%", opacity: 0.15 },
  { offset: "22%", opacity: 0.65 },
  { offset: "37%", opacity: 1.00 },
  { offset: "52%", opacity: 0.85 },
  { offset: "68%", opacity: 0.40 },
  { offset: "85%", opacity: 0.08 },
  { offset: "100%", opacity: 0.00 },
];

/**
 * Deterministic hash returning a float in range [0, 1).
 * Never uses Math.random().
 */
export function hash01(seed: string, salt: string = ""): number {
  const str = seed + salt;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 100000) / 100000;
}

export function deterministicInRange(seed: string, min: number, max: number): number {
  const norm = hash01(seed);
  return min + norm * (max - min);
}

/** Stacking transform for depth. index 0 = newest = frontmost. */
export function depthTransform(
  index: number,
  _total: number
): {
  scale: number;
  offsetY: number;
  opacity: number;
  blurPx: number;
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

/** Compute deterministic line origin for a project: originX 240..1010, originY 145..545 */
export function getProjectLineOrigin(id: string): Point {
  return {
    x: Math.round((240 + hash01(id, "x") * 770) * 10) / 10,
    y: Math.round((145 + hash01(id, "y") * 400) * 10) / 10,
  };
}

/** Compute deterministic line angle for a project: 22.0°..23.0° */
export function getProjectLineAngle(id: string): number {
  const jitter = (hash01(id, "angle") - 0.5) * 1.0; // -0.5°..+0.5°
  return Math.round((22.5 + jitter) * 100) / 100;
}

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

export type BranchSpec = {
  id: string;
  startDate?: string | null;
};

export type ResolvedBranchPath = {
  id: string;
  from: Point;
  to: Point;
  length: number;
  angleDeg: number;
};

/**
 * Resolves Episode branch paths along the parent project line.
 * Parent line: 981 × 408.5 at (457, 317.5) — length 1062.7, angle 22.61°, 1px stroke.
 * Branches: 0.5px stroke, angle 12°..85.5°, length 60..466.
 */
export function resolveEpisodeBranchPaths(
  parentOrigin: Point = { x: 457, y: 317.5 },
  parentLength: number = 1062.7,
  parentAngleDeg: number = 22.61,
  episodes: BranchSpec[],
  projectStartDate?: string | null,
  projectEndDate?: string | null
): ResolvedBranchPath[] {
  if (!episodes || episodes.length === 0) return [];

  const projStart = projectStartDate ? new Date(projectStartDate).getTime() : NaN;
  const projEnd = projectEndDate ? new Date(projectEndDate).getTime() : NaN;
  const hasSpan = !isNaN(projStart) && !isNaN(projEnd) && projEnd > projStart;

  return episodes.map((ep, idx) => {
    let anchorT: number;
    if (hasSpan && ep.startDate) {
      const epStart = new Date(ep.startDate).getTime();
      if (!isNaN(epStart)) {
        anchorT = (epStart - projStart) / (projEnd - projStart);
      } else {
        anchorT = (idx + 1) / (episodes.length + 1);
      }
    } else {
      anchorT = (idx + 1) / (episodes.length + 1);
    }
    anchorT = Math.max(0.05, Math.min(0.95, anchorT));

    const relAngle = 12 + hash01(ep.id, "angle") * 73.5; // 12°..85.5°
    const length = Math.round((60 + hash01(ep.id, "len") * 406) * 10) / 10; // 60..466

    // Alternate sides based on index parity
    const side = idx % 2 === 0 ? 1 : -1;
    const finalAngle = Math.round((parentAngleDeg + side * relAngle) * 100) / 100;

    const from = pointAlongLine(parentOrigin, parentLength, anchorT, parentAngleDeg);
    const to = lineEndpoint(from, length, finalAngle);

    return {
      id: ep.id,
      from,
      to,
      length,
      angleDeg: finalAngle,
    };
  });
}
