export default function ProductionToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">
          Production Tracker
        </h1>

        <p className="text-sm text-slate-400">
          Track episodes, tasks, assets, reviews, and completion.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search episodes..."
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500"
        />

        <button className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700">
          Filter
        </button>

        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500">
          Add Job
        </button>
      </div>
    </div>
  );
}