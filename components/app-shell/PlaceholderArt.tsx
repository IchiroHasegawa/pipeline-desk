import React from "react";

export interface PlaceholderArtProps {
  seed: string;
  className?: string;
  rounded?: boolean | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  role?: string;
  "aria-label"?: string;
}

/**
 * Computes a deterministic integer hue in [0, 359] from an arbitrary seed string.
 */
export function hashSeedToHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

/**
 * Generates the CSS background string matching the approved Production OS v2 prototype:
 * repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 1px, transparent 1px 11px),
 * linear-gradient(145deg, oklch(0.76 0.055 H), oklch(0.5 0.065 (H+40)%360))
 */
export function getPlaceholderBackground(seed: string): string {
  const h = hashSeedToHue(seed);
  const h2 = (h + 40) % 360;
  return `repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 1px, transparent 1px 11px), linear-gradient(145deg, oklch(0.76 0.055 ${h}), oklch(0.5 0.065 ${h2}))`;
}

export const PlaceholderArt: React.FC<PlaceholderArtProps> = ({
  seed,
  className = "",
  rounded,
  children,
  style,
  role,
  "aria-label": ariaLabel,
}) => {
  const roundedClass =
    typeof rounded === "string"
      ? rounded
      : rounded === true
      ? "rounded-[14px]"
      : "";

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={`relative overflow-hidden ${roundedClass} ${className}`.trim()}
      style={{
        backgroundImage: getPlaceholderBackground(seed),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default PlaceholderArt;
