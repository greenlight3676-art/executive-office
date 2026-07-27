"use client";

import { FormEvent, useState } from "react";

type BoardResponse = {
  executive: string;
  role: string;
  provider: string | null;
  model: string | null;
  text: string;
  status: "complete" | "failed";
};

type Decision = {
  outcome: "approved" | "revise" | "blocked";
  approved: number;
  revise: number;
  completed: number;
  total: number;
};

export function BoardroomPanel() {
  const [mission, setMission] = useState("");
  const [responses, setResponses] = useState<BoardResponse[]>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  async function runBoardroom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMission = mission.trim();
    if (!cleanMission || isRunning) return;

    setIsRunning(true);
    setError("");
    setResponses([]);
    setDecision(null);

    try {
      const response = await fetch("/api/boardroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission: cleanMission }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Boardroom failed.");
      setResponses(Array.isArray(payload.responses) ? payload.responses : []);
      setDecision(payload.decision ?? null);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Boardroom failed.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-300">Live Board Room</p>
          <h2 className="mt-2 text-2xl font-semibold">Five executives. One decision.</h2>
          <p className="mt-2 text-sm text-zinc-400">Give Forge one mission. Every executive reviews it from their specialty and votes.</p>
        </div>
        {decision ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${decision.outcome === "approved" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : decision.outcome === "revise" ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200"}`}>
            <div className="text-xs uppercase tracking-[0.2em] opacity-70">Board decision</div>
            <div className="mt-1 font-semibold uppercase">{decision.outcome}</div>
            <div className="mt-1 text-xs opacity-80">{decision.completed}/{decision.total} responded • {decision.approved} approve • {decision.revise} revise</div>
          </div>
        ) : null}
      </div>

      <form onSubmit={runBoardroom} className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <textarea
          value={mission}
          onChange={(event) => setMission(event.target.value)}
          rows={3}
          placeholder="Example: Finish Forge's first usable version with working missions, executive chat, and a clean mobile dashboard."
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-fuchsia-400/40"
        />
        <button
          type="submit"
          disabled={!mission.trim() || isRunning}
          className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:min-w-44"
        >
          {isRunning ? "Board is meeting..." : "Run Board Room"}
        </button>
      </form>

      {error ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div> : null}

      {isRunning ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {["Brayko", "Lunexa", "Vyreel", "Orynth", "Kavro"].map((name) => (
            <div key={name} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-medium">{name}</div>
              <div className="mt-3 h-2 rounded bg-white/10" />
              <div className="mt-2 h-2 w-3/4 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : responses.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {responses.map((response) => (
            <article key={response.executive} className={`rounded-2xl border p-4 ${response.status === "complete" ? "border-white/10 bg-white/5" : "border-rose-400/20 bg-rose-400/10"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-zinc-100">{response.executive}</h3>
                  <p className="text-xs text-zinc-500">{response.role}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-400">{response.provider ?? "offline"}</span>
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{response.text}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-500">The board is waiting for its first mission.</div>
      )}
    </section>
  );
}
