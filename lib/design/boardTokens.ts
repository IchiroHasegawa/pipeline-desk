/**
 * Presentation tokens shared by the Project Board, Scene Assembly and Asset
 * Assembly boards. Deliberately dependency-free: no React, no imports.
 *
 * Colour, radius and type come from the CSS custom properties in
 * app/globals.css and are referenced as var(--…) at the point of use. Only the
 * blue accent and the card shadows below are new values that have no variable.
 */

export const BOARD_GUTTER = 25;              // px between panels, constant
export const PANEL_MIN_WIDTH = 320;
export const PANEL_MAX_WIDTH = 720;
export const PANEL_TOP_BAR_HEIGHT = 3;       // solid dark bar across panel top
export const PANEL_HEIGHT = 720;             // fixed; panels do not fill the viewport
export const MEASURE_BAR_HEIGHT = 34;        // duration bar above each panel
export const MEASURE_TICK_HEIGHT = 10;

export const BOARD_ACCENT = "#2E90E5";
export const BOARD_ACCENT_LIGHT = "#5FB0F0";
export const BOARD_ACCENT_GRADIENT =
  "linear-gradient(160deg, #2E90E5 0%, #5FB0F0 100%)";

export const CARD_SHADOW = "6px 10px 4px rgba(0, 0, 0, 0.10)";
export const CARD_SHADOW_HOVER = "8px 14px 6px rgba(0, 0, 0, 0.14)";
export const HAIRLINE = "0.5px";

// Fixed graph sizes. Phase 2 renders these; phase 1 only reserves the type.
export const GRAPH_SIZES = {
  episodeStatus: { width: 200, height: 260 },
  commits:       { width: 280, height: 170 },
  assets:        { width: 190, height: 240 },
  reviews:       { width: 170, height: 210 },
} as const;

export type GraphId = keyof typeof GRAPH_SIZES;

/**
 * Where each card sits inside a panel body before the user moves it.
 *
 * Cards overlap at corners by 20-70px rather than face-on, so no card occludes
 * another's content. Total extent is 430px wide by 640px tall, inside
 * PANEL_HEIGHT:
 *
 *   episodeStatus 200x260 -> 20-220,  24-284
 *   commits       280x170 -> 150-430, 210-380
 *   assets        190x240 -> 34-224,  320-560
 *   reviews       170x210 -> 246-416, 430-640
 *
 * The shape is written inline rather than imported as GraphPosition so this
 * module stays dependency-free; it is structurally identical.
 */
export const DEFAULT_GRAPH_LAYOUT: Record<
  GraphId,
  { x: number; y: number; z: number }
> = {
  episodeStatus: { x: 20, y: 24, z: 1 },
  commits: { x: 150, y: 210, z: 3 },
  assets: { x: 34, y: 320, z: 2 },
  reviews: { x: 246, y: 430, z: 1 },
};
