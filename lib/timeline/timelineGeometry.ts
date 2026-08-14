export const TIMELINE_ANGLE_DEG = 22.5;

export type Point = { x: number; y: number };

export type LineSegment = { x1: number; y1: number; x2: number; y2: number };

export type GradientStop = { offset: string; opacity: number };

/* ------------------------------------------------------------------ *
 * World space
 *
 * Every canvas page draws into the same 1920 × 1080 viewBox with
 * preserveAspectRatio="xMidYMid meet". "World units" below always means
 * this space — never DOM pixels, which diverge from it at any aspect
 * ratio other than 16:9.
 * ------------------------------------------------------------------ */

export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;
export const WORLD_CENTER: Point = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };

/**
 * Pan + zoom applied to one layer. Composed as SVG
 * `translate(x, y) scale(scale)` about world origin (0, 0), so
 * `worldToView` below is the exact inverse-free forward mapping.
 */
export type CanvasTransform = { x: number; y: number; scale: number };

export const IDENTITY_TRANSFORM: CanvasTransform = { x: 0, y: 0, scale: 1 };

export const MIN_CANVAS_SCALE = 0.5;
export const MAX_CANVAS_SCALE = 2;

/** Maps a world point through a transform into post-transform view space. */
export function worldToView(p: Point, t: CanvasTransform): Point {
  return { x: p.x * t.scale + t.x, y: p.y * t.scale + t.y };
}

/** Maps a post-transform view point back into world space. */
export function viewToWorld(p: Point, t: CanvasTransform): Point {
  return { x: (p.x - t.x) / t.scale, y: (p.y - t.y) / t.scale };
}

export function transformToSvg(t: CanvasTransform): string {
  return `translate(${t.x} ${t.y}) scale(${t.scale})`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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

/* ------------------------------------------------------------------ *
 * Shared canvas configuration
 *
 * Every ratio here is measured; the measurement is recorded beside it so
 * the value can be re-derived or re-tuned without going back to Figma.
 * No page may re-declare these locally.
 * ------------------------------------------------------------------ */

/** Project lines rendered as foreground, interactive lines. */
export const MAX_VISIBLE_PROJECTS = 5;

/** Projects beyond the window render behind, blurred and inert. */
export const GHOST_BLUR_PX = 3.5;
export const GHOST_OPACITY = 0.3;

/**
 * Fade behaviour — EXCLUSIVE to the project line.
 *
 * Derived from TIMELINE_LINE_FADE_STOPS (DESIGN_SPEC §4): opacity climbs
 * 0.00 → 1.00 over 0%–37% of the line, then decays 1.00 → 0.00 over
 * 37%–100%. TIMELINE_LINE_FADE_STOPS stays the rendering authority; these
 * two ratios exist so other geometry (attachment clamps, the Episode-page
 * bounding box) can reason about where the line is actually visible.
 */
export const PROJECT_LINE_FADE_IN_RATIO = 0.37;
export const PROJECT_LINE_FADE_OUT_RATIO = 0.63;

/**
 * Episode attachment along the project line.
 *
 * Measured from DESIGN_SPEC §5. The Episode-page project line has bbox
 * 981 × 408.5 at (457, 317.5), i.e. it runs (457, 726) → (1438, 317.5) at
 * 22.61°. Of the eight measured branch vectors only two touch that line:
 *
 *   Vector 19, origin   (917.5, 535) → t = (917.5 − 457) / 981 = 0.469
 *   Vector 27, endpoint (1180, 424)  → t = (1180  − 457) / 981 = 0.737
 *
 * The remaining six hang off those two as sub-branches. The mock therefore
 * only pins down one gap; 0.27 is that single measured difference. Tune
 * EPISODE_ATTACH_GAP_RATIO if episodes should sit tighter or looser.
 */
export const EPISODE_ATTACH_START_RATIO = 0.47;
export const EPISODE_ATTACH_GAP_RATIO = 0.27;

/**
 * Scene page: day attachment along the vertical episode line.
 *
 * Measured off reference image 8 (rendered 1600px wide for a 1920 canvas,
 * so image px ÷ 0.8333 = world units). The two day junctions sit at image
 * y ≈ 380 and ≈ 492 → world y ≈ 456 and ≈ 590. At rest the line spans
 * y −25 → 818 (DESIGN_SPEC §7), a span of 843:
 *
 *   t₁ = (456 + 25) / 843 = 0.571
 *   t₂ = (590 + 25) / 843 = 0.730   → gap 0.159
 */
export const DAY_ATTACH_START_RATIO = 0.57;
export const DAY_ATTACH_GAP_RATIO = 0.16;

/**
 * Task attachment along its parent day branch. Reference image 9 shows
 * task lines leaving roughly a third of the way along the parent, spaced
 * about a fifth apart. Eyeballed from the raster, not the design file —
 * the most likely of these constants to want tuning.
 */
export const TASK_ATTACH_START_RATIO = 0.34;
export const TASK_ATTACH_GAP_RATIO = 0.22;

/**
 * Attachments never run past this point along a parent, so the parent's
 * tail is left clear and branches never stack on the endpoint.
 */
export const ATTACH_MAX_RATIO = 0.95;

/* Stroke + type tokens shared by the SVG lines and the left name panel. */

/** px at scale = 1. DESIGN_SPEC §0 `--stroke-regular`. */
export const LINE_STROKE_WIDTH = 1;

/** DESIGN_SPEC §0 `--stroke-hairline`. Episode / day / task branches. */
export const BRANCH_STROKE_WIDTH = 0.5;

/** MUST equal LINE_STROKE_WIDTH — bound to it rather than re-typed. */
export const PANEL_UNDERLINE_WIDTH = LINE_STROKE_WIDTH;

/**
 * Canvas label typography. The list panel and every text label drawn on
 * or beside a line pull from these, so the panel can never drift from the
 * canvas. Values are DESIGN_SPEC §0 `--text-list`.
 */
export const CANVAS_LABEL_FONT_SIZE = 12;
export const CANVAS_LABEL_FONT_WEIGHT = 500;
export const CANVAS_LABEL_LETTER_SPACING = "0em";

/** List panel row pitch — DESIGN_SPEC §3. */
export const PANEL_ROW_PITCH = 46.4;

/* ------------------------------------------------------------------ *
 * Attachment maths — written once, used by the Episode and Scene pages
 * ------------------------------------------------------------------ */

/**
 * Point at `startRatio + index * gapRatio` along `line`.
 *
 * The ratio is clamped to [0, ATTACH_MAX_RATIO] so an out-of-range index
 * lands on the line rather than off the end of it. Callers with a known
 * item count should pass a gap from `resolveAttachmentGap` instead of
 * relying on that clamp, which would otherwise stack every overflowing
 * branch on the same point.
 */
export function getAttachmentPoint(
  line: LineSegment,
  index: number,
  startRatio: number,
  gapRatio: number
): Point {
  const t = clamp(startRatio + index * gapRatio, 0, ATTACH_MAX_RATIO);
  return {
    x: line.x1 + (line.x2 - line.x1) * t,
    y: line.y1 + (line.y2 - line.y1) * t,
  };
}

/**
 * The gap to actually use for `count` items.
 *
 * The measured gap is honoured whenever the items fit between `startRatio`
 * and `maxRatio`. Past that the gap compresses so they stay evenly spread
 * across the remaining span instead of piling up on the clamp.
 */
export function resolveAttachmentGap(
  count: number,
  startRatio: number,
  gapRatio: number,
  maxRatio: number = ATTACH_MAX_RATIO
): number {
  if (count <= 1) return gapRatio;
  const span = Math.max(0, maxRatio - startRatio);
  const needed = gapRatio * (count - 1);
  return needed <= span ? gapRatio : span / (count - 1);
}

/** Convenience: every attachment point for `count` items, gap auto-fitted. */
export function getAttachmentPoints(
  line: LineSegment,
  count: number,
  startRatio: number,
  gapRatio: number
): Point[] {
  const gap = resolveAttachmentGap(count, startRatio, gapRatio);
  return Array.from({ length: count }, (_, i) =>
    getAttachmentPoint(line, i, startRatio, gap)
  );
}

/** A line described by origin + length + angle, as a plain segment. */
export function toSegment(
  origin: Point,
  length: number,
  angleDeg: number = TIMELINE_ANGLE_DEG
): LineSegment {
  const end = lineEndpoint(origin, length, angleDeg);
  return { x1: origin.x, y1: origin.y, x2: end.x, y2: end.y };
}

/**
 * Point on a segment at a given x, clamped to the segment's span.
 * Used to anchor the focus-mode thumbnail connector onto the project line.
 */
export function pointOnSegmentAtX(line: LineSegment, x: number): Point {
  const dx = line.x2 - line.x1;
  if (Math.abs(dx) < 1e-6) return { x: line.x1, y: line.y1 };
  const t = clamp((x - line.x1) / dx, 0, 1);
  return { x: line.x1 + dx * t, y: line.y1 + (line.y2 - line.y1) * t };
}

/* ------------------------------------------------------------------ *
 * Episode page bounding box
 * ------------------------------------------------------------------ */

export type BoundingBox = { x: number; y: number; width: number; height: number };

/**
 * The Episode page's invisible boundary.
 *
 * Width  — the project line's full horizontal extent, origin to the pixel
 *          at which it has completely faded out (the fade reaches 0 at
 *          t = 1, so that is the line's own end).
 * Height — the total vertical span from the topmost branch above the
 *          project line to the bottommost branch below it. The line's own
 *          endpoints are folded in so the line can never be clipped by its
 *          own box when there are few or no branches.
 */
export function computeEpisodeBoundingBox(
  line: LineSegment,
  branches: { from: Point; to: Point }[],
  padding: number = 0
): BoundingBox {
  const xs = [line.x1, line.x2];
  const ys = [line.y1, line.y2];

  for (const b of branches) {
    ys.push(b.from.y, b.to.y);
    // Branch ends may reach past the line horizontally; the box must still
    // contain the line's full length, so extend rather than replace.
    xs.push(b.from.x, b.to.x);
  }

  const minX = Math.min(...xs) - padding;
  const maxX = Math.max(...xs) + padding;
  const minY = Math.min(...ys) - padding;
  const maxY = Math.max(...ys) + padding;

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Fade applied at the bounding box's edges.
 *
 * This is a SEPARATE mechanism from the project line's endpoint fade
 * (TIMELINE_LINE_FADE_STOPS / PROJECT_LINE_FADE_*). It applies to any line
 * type that reaches the boundary, and is named distinctly on purpose —
 * do not merge the two.
 */
export const BOX_EDGE_FADE_RATIO = 0.06;

/* ------------------------------------------------------------------ *
 * Focus-mode thumbnail + connector
 * ------------------------------------------------------------------ */

/**
 * Where the connector meets the thumbnail, and how far back along the
 * project line it starts. Both pages share the shape; only the numbers
 * differ.
 */
export type ThumbnailConnectorSpec = {
  /** Thumbnail frame in world units. */
  rect: BoundingBox;
  /** Horizontal run from the line anchor to the thumbnail's left edge. */
  run: number;
  /** How far below the thumbnail's top edge the connector lands. */
  entryInset: number;
};

/**
 * Project page — DESIGN_SPEC §4.
 *
 * Verifies against the measured focus line (956 × 403.5 at (541.5, 296.5),
 * i.e. (541.5, 700) → (1497.5, 296.5)): at the connector's start x of
 * 1093.5, the line sits at y = 700 − 552 × (403.5 / 956) = 467.0, which is
 * exactly the measured connector origin (1093.5, 467). The connector then
 * runs 50 across and 13 down to (1143.5, 480) — the thumbnail's left edge,
 * 12 below its top. So `run` and `entryInset` reproduce the design exactly
 * while staying correct when the line moves.
 */
export const PROJECT_FOCUS_CONNECTOR: ThumbnailConnectorSpec = {
  rect: { x: 1143.5, y: 468, width: 214, height: 125 },
  run: 50,
  entryInset: 12,
};

/** Episode page — DESIGN_SPEC §5. Connector 68.5 × 130.5 at (1115.5, 435.5). */
export const EPISODE_FOCUS_CONNECTOR: ThumbnailConnectorSpec = {
  rect: { x: 1184.5, y: 547, width: 424, height: 469 },
  run: 68.5,
  entryInset: 19,
};

/**
 * Resolves the connector path for a line that has been moved by `transform`.
 *
 * Both endpoints are returned in post-transform view space: the anchor is
 * the line point pushed through the transform, the entry point is the
 * thumbnail's own fixed frame. Computing it this way — rather than from a
 * DOM rect — is what keeps it attached under pan, zoom and resize, since
 * world units and DOM pixels diverge at any aspect ratio but 16:9.
 */
export function resolveThumbnailConnector(
  line: LineSegment,
  transform: CanvasTransform,
  spec: ThumbnailConnectorSpec
): { from: Point; to: Point } {
  const to: Point = {
    x: spec.rect.x,
    y: spec.rect.y + spec.entryInset,
  };

  // Walk back along the line in view space, so the run stays visually
  // constant instead of shrinking as the line zooms out.
  const a = worldToView({ x: line.x1, y: line.y1 }, transform);
  const b = worldToView({ x: line.x2, y: line.y2 }, transform);
  const viewLine: LineSegment = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };

  const from = pointOnSegmentAtX(viewLine, to.x - spec.run);

  return { from, to };
}

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

/* ------------------------------------------------------------------ *
 * Scene page geometry (DESIGN_SPEC §7)
 * ------------------------------------------------------------------ */

/** Vertical episode line x: 957.8 at entrance, 473.2 when a day is focused. */
export const SCENE_LINE_X_ENTRANCE = 957.8;
export const SCENE_LINE_X_FOCUS = 473.2;

/**
 * The line is two contiguous segments meeting at y = 384.
 * Entrance: 0 × 409 from y −25, then 0 × 434 from y 384.
 * Focus lengths (1288.7 / 1367.5) are these same values × 3.15.
 */
export const SCENE_LINE_JUNCTION_Y = 384;
export const SCENE_LINE_SEG_UPPER = 409;
export const SCENE_LINE_SEG_LOWER = 434;

/** Entrance → focus zoom. 139→438 and 411.3→1295.8 both give 3.15. */
export const SCENE_ZOOM_FOCUS = 3.15;

/** Day branch angle range, measured: 32.16° and 47.15°. */
export const SCENE_BRANCH_ANGLE_MIN = 32;
export const SCENE_BRANCH_ANGLE_MAX = 47.15;

/** Day branch length range at rest, measured: 139.0 and 411.3. */
export const SCENE_BRANCH_LEN_MIN = 139;
export const SCENE_BRANCH_LEN_MAX = 411.3;

/** Vertical extent of the episode line at a given zoom. */
export function sceneLineExtent(zoom: number): { top: number; bottom: number } {
  return {
    top: SCENE_LINE_JUNCTION_Y - SCENE_LINE_SEG_UPPER * zoom,
    bottom: SCENE_LINE_JUNCTION_Y + SCENE_LINE_SEG_LOWER * zoom,
  };
}

/**
 * Day branch angle and rest-length, both derived deterministically from the
 * day id. Angle is identical across zoom states — only length scales.
 */
export function sceneBranchSpec(dayId: string): {
  angleDeg: number;
  restLength: number;
} {
  return {
    angleDeg:
      SCENE_BRANCH_ANGLE_MIN +
      hash01(dayId, "angle") * (SCENE_BRANCH_ANGLE_MAX - SCENE_BRANCH_ANGLE_MIN),
    restLength:
      SCENE_BRANCH_LEN_MIN +
      hash01(dayId, "len") * (SCENE_BRANCH_LEN_MAX - SCENE_BRANCH_LEN_MIN),
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
  episodes: BranchSpec[]
): ResolvedBranchPath[] {
  if (!episodes || episodes.length === 0) return [];

  const parent = toSegment(parentOrigin, parentLength, parentAngleDeg);

  // §3.4 — attachment is driven entirely by the measured constants through
  // getAttachmentPoint, the same helper the Scene page uses for days and
  // tasks. Episode start dates no longer move the junction: the reference
  // spaces branches evenly along the line, and letting dates slide them
  // around is what made the junctions drift off the line.
  const gap = resolveAttachmentGap(
    episodes.length,
    EPISODE_ATTACH_START_RATIO,
    EPISODE_ATTACH_GAP_RATIO
  );

  return episodes.map((ep, idx) => {
    const relAngle = 12 + hash01(ep.id, "angle") * 73.5; // 12°..85.5°, DESIGN_SPEC §5
    const length = Math.round((60 + hash01(ep.id, "len") * 406) * 10) / 10; // 60..466

    // Alternate sides so the branches read as a tree rather than a comb.
    const side = idx % 2 === 0 ? 1 : -1;
    const finalAngle = Math.round((parentAngleDeg + side * relAngle) * 100) / 100;

    const from = getAttachmentPoint(
      parent,
      idx,
      EPISODE_ATTACH_START_RATIO,
      gap
    );
    const to = lineEndpoint(from, length, finalAngle);

    return { id: ep.id, from, to, length, angleDeg: finalAngle };
  });
}
