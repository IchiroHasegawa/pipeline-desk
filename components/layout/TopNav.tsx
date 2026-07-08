const navItems = [
  "Overview",
  "Production",
  "Open Tasks",
  "Assets",
  "Review",
  "Reports",
  "Views",
  "Settings",
];

export default function TopNav() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950 px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        <div className="text-lg font-bold text-slate-100">
          PipelineDesk
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item}
              className={`rounded-md px-3 py-2 text-sm ${
                item === "Production"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
          Admin
        </div>
      </div>
    </nav>
  );
}