type ProgressCircleProps = {
  value: number;
  label?: string;
  size?: number;
};

export default function ProgressCircle({
  value,
  label,
  size = 44,
}: ProgressCircleProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      {label && (
        <span className="text-[10px] text-slate-400 whitespace-nowrap">
          {label}
        </span>
      )}

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-700"
            fill="transparent"
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-blue-500"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-slate-100">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}