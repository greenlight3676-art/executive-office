import type { Executive } from "@/app/page";

type ExecutiveStatusPanelProps = {
  executives: Executive[];
  activeExecutiveName: string;
  onSelect: (executive: Executive) => void;
};

const statusStyles: Record<Executive["status"], string> = {
  Aligned: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Reviewing: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  Drafting: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  Escalating: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export function ExecutiveStatusPanel({
  executives,
  activeExecutiveName,
  onSelect,
}: ExecutiveStatusPanelProps) {
  const activeExecutive = executives.find((item) => item.name === activeExecutiveName) ?? executives[0];

  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Executive Workspace</p>
          <h2 className="mt-2 text-xl font-semibold">Operational status</h2>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
          Status: aligned
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {executives.map((executive) => {
            const isActive = activeExecutive.name === executive.name;
            return (
              <button
                key={executive.name}
                onClick={() => onSelect(executive)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${isActive ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${executive.accent}`} />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{executive.name}</div>
                    <div className="text-sm text-zinc-400">{executive.title}</div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${statusStyles[executive.status]}`}>
                    {executive.status}
                  </span>
                </div>
                <div className="mt-3 text-sm text-zinc-400">{executive.focus}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">Live focus</div>
          <div className="mt-3 text-xl font-semibold">{activeExecutive.name}</div>
          <div className="mt-1 text-sm text-zinc-400">{activeExecutive.title}</div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            <div className="font-medium text-zinc-100">Next move</div>
            <div className="mt-1">{activeExecutive.nextMove}</div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-zinc-400">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span>Priority</span>
              <span className="text-zinc-100">{activeExecutive.focus}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span>Latency</span>
              <span className="text-zinc-100">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
