// Copied from components/board for the redesign; the original is removed at cutover.
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo, useState } from "react";
import { Check } from "lucide-react";
import type { BoardElement } from "@/types/production-v2";
import { PlaceholderArt } from "@/components/app-shell";

export type ImageElementProps = {
  element: BoardElement;
  selected?: boolean;
  isProjectScoped?: boolean;
  showCheckbox?: boolean;
  onToggleCheckbox?: (element: BoardElement) => void;
  onSelect?: (e: React.PointerEvent) => void;
  onDoubleClick?: (element: BoardElement) => void;
};

export const ImageElementComponent: React.FC<ImageElementProps> = ({
  element,
  selected = false,
  isProjectScoped = false,
  showCheckbox = false,
  onToggleCheckbox,
  onSelect,
  onDoubleClick,
}) => {
  const width = element.width || 339;
  const height = element.height || 198;
  const isStrayKeyframe = isProjectScoped && element.elementType === "keyframe";
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onPointerDown={onSelect}
      onDoubleClick={() => onDoubleClick && onDoubleClick(element)}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`relative select-none cursor-grab active:cursor-grabbing rounded-[14px] overflow-hidden transition-all duration-150 ${
        isStrayKeyframe
          ? "opacity-50 grayscale border-2 border-dashed border-red-500 bg-red-500/10"
          : selected
          ? "border-2 border-[var(--po-accent)] ring-2 ring-[var(--po-accent)]/20 shadow-[var(--po-shadow)]"
          : "border border-[var(--po-line)] hover:border-[var(--po-line-2)] shadow-[var(--po-shadow-sm)]"
      } bg-[var(--po-card)]`}
    >
      {/* Asset Assembly Checkbox */}
      {showCheckbox && element.elementType === "asset" && Boolean(element.assetId) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheckbox?.(element);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          aria-label={selected ? "Deselect asset" : "Select asset"}
          className="absolute top-2 left-2 z-20 flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-[1.5px] border-white/90 text-white transition-all cursor-pointer shadow-xs"
          style={{
            background: selected ? "var(--po-accent)" : "rgba(0,0,0,0.3)",
          }}
        >
          {selected && <Check size={13} strokeWidth={2.5} />}
        </button>
      )}

      {element.imageUrl && !imgError ? (
        <img
          src={element.imageUrl}
          alt={element.title || (element.elementType === "keyframe" ? "Keyframe" : "Asset")}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <PlaceholderArt seed={element.id} className="w-full h-full object-cover pointer-events-none" />
      )}

      {/* Stray Keyframe Badge */}
      {isStrayKeyframe ? (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-red-600 text-white font-mono font-bold text-[10px] rounded shadow-xs">
          STRAY KEYFRAME
        </div>
      ) : (
        element.keyframeNumber !== null && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/65 text-white font-mono font-bold text-[11px] rounded-[6px] tracking-[0.03em] backdrop-blur-xs shadow-xs">
            KF {element.keyframeNumber}
          </div>
        )
      )}

      {/* Asset Element Title Footer if Asset */}
      {element.elementType === "asset" && element.title && (
        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white flex flex-col pointer-events-none">
          <span className="text-[12px] font-semibold truncate leading-tight drop-shadow-xs">
            {element.title}
          </span>
        </div>
      )}
    </div>
  );
};

export const ImageElement = memo(ImageElementComponent);
export default ImageElement;
