/**
 * Canvas transform types and identity transform token for CanvasShell.
 * Moved verbatim from timelineGeometry.
 */

export type CanvasTransform = { x: number; y: number; scale: number };

export const IDENTITY_TRANSFORM: CanvasTransform = { x: 0, y: 0, scale: 1 };
