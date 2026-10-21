import React from "react";

export interface SkeletonCardProps {
  count?: number;
}

export const SkeletonCard: React.FC = () => {
  return (
    <div className="grid grid-cols-[minmax(0,34%)_minmax(0,1fr)] gap-7 rounded-[24px] border border-[var(--po-line)] bg-[var(--po-card)] p-[14px]">
      {/* Thumbnail placeholder */}
      <div className="aspect-video rounded-[16px] bg-[var(--po-sk)]" />

      {/* Content lines placeholder */}
      <div className="flex flex-col gap-[14px] pt-2">
        <div className="h-[22px] w-[30%] rounded-[8px] bg-[var(--po-sk)]" />
        <div className="h-[12px] w-[58%] rounded-[6px] bg-[var(--po-sk)]" />
        <div className="h-[12px] w-[92%] rounded-[6px] bg-[var(--po-sk)]" />
        <div className="h-[12px] w-[70%] rounded-[6px] bg-[var(--po-sk)]" />
        <div className="mt-auto grid grid-cols-5 gap-[10px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-[12px] bg-[var(--po-sk)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonGridItem: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[var(--po-line)] bg-[var(--po-card)] p-[10px]">
      <div className="aspect-[16/7] rounded-[12px] bg-[var(--po-sk)]" />
      <div className="mx-1 h-[14px] w-[40%] rounded-[6px] bg-[var(--po-sk)]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="mx-1 h-[22px] rounded-[8px] bg-[var(--po-sk)]"
        />
      ))}
    </div>
  );
};

export const Skeleton: React.FC<{
  variant?: "cards" | "grid";
  count?: number;
}> = ({ variant = "cards", count = 3 }) => {
  if (variant === "grid") {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonGridItem key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
