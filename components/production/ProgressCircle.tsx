type ProgressCircleProps = {
  value: number;
  label?: string;
  size?: number;
};

function getProgressColor(value: number) {
  if (value >= 90) return "#22c55e";
  if (value >= 50) return "#3b82f6";
  if (value > 0) return "#eab308";
  return "#ef4444";
}

export default function ProgressCircle({
  value,
  label,
  size = 28,
}: ProgressCircleProps) {
  const strokeWidth = size <= 32 ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      {label && (
        <span className="whitespace-nowrap text-[10px] text-zinc-400">
          {label}
        </span>
      )}

      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="#2a2a2a"
            fill="transparent"
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={getProgressColor(progress)}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <span className="absolute text-[8px] font-bold text-[#e0e0e0]">
          {progress}%
        </span>
      </div>
    </div>
  );
}
