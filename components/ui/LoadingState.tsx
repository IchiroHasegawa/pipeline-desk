export function DevelopmentFallbackWarning({
  errorMessage,
  onRetry,
}: {
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-100">
      <span>
        Development warning: Supabase data failed to load. Mock production data
        is being displayed.
      </span>
      <button
        onClick={onRetry}
        className="rounded border border-yellow-500/40 px-2 py-1 font-bold text-yellow-50 transition-colors hover:bg-yellow-500/20"
        title={errorMessage}
      >
        Retry
      </button>
    </div>
  );
}

export function LoadingMessage({ message = "Loading data from Supabase..." }: { message?: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4">
      <div className="rounded border border-[#2a2a2a] bg-[#121212] px-4 py-3 text-sm text-zinc-300">
        {message}
      </div>
    </div>
  );
}

export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4">
      <div className="space-y-3 rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        <p>{message}</p>
        <button
          onClick={onRetry}
          className="rounded border border-red-400/40 px-3 py-1 text-xs font-bold transition-colors hover:bg-red-500/20"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
