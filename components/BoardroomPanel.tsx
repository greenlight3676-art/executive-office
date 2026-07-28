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
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSavingMission, setIsSavingMission] = useState(false);
  const [savedMissionId, setSavedMissionId] = useState("");
  const [error, setError] = useState("");

  async function runBoardroom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMission = mission.trim();
    if (!cleanMission || isRunning) return;

    setIsRunning(true);
    setError("");
    setResponses([]);
    setDecision(null);
    setSynthesis(null);
    setSavedMissionId("");

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
      setSynthesis(typeof payload.synthesis === "string" ? payload.synthesis : null);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Boardroom failed.");
    } finally {
      setIsRunning(false);
    }
  }

  async function saveAsMission() {
    if (!mission.trim() || !synthesis || isSavingMission) return;

    setIsSavingMission(true);
    setError("");

    try {
      const title =
        mission.trim().length > 72
          ? `${mission.trim().slice(0, 69).trimEnd()}...`
          : mission.trim();
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: synthesis,
          projectId: "forge",
          createdBy: "tj",
          assignedExecutives: ["orynth", "brayko", "lunexa", "vyreel", "kavro"],
          priority: "high",
          status: "planned",
          metadata: {
            source: "boardroom",
            decision: decision?.outcome,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save mission.");
      setSavedMissionId(payload.mission?.id ?? "saved");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save mission.");
    } finally {
      setIsSavingMission(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Board Room Test</p>
          <h2 className="mt-2 text-2xl font-semibold">Run all executives</h2>
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
          placeholder="Type a real mission to test the boardroom..."
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
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-500">No boardroom run yet.</div>
      )}

      {synthesis ? (
        <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.04] to-fuchsia-400/10 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Synthesis</p>
              <h3 className="mt-2 text-xl font-semibold">Board output</h3>
            </div>
            <button
              type="button"
              onClick={() => void saveAsMission()}
              disabled={isSavingMission || Boolean(savedMissionId)}
              className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savedMissionId ? "Saved to Mission Center" : isSavingMission ? "Saving..." : "Save as mission"}
            </button>
          </div>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{synthesis}</div>
        </div>
      ) : null}
    </section>
  );
}
