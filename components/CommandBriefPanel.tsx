"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/browser";
import type { CommandBrief } from "@/lib/command-brief/service";

function riskClass(riskLevel: CommandBrief["riskLevel"]) {
  if (riskLevel === "high") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (riskLevel === "medium") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}

export function CommandBriefPanel() {
  const [brief, setBrief] = useState<CommandBrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBrief() {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/command-brief", { cache: "no-store" });
      const payload = (await response.json()) as { brief?: CommandBrief; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load command brief.");
      setBrief(payload.brief ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load command brief.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadBrief);
  }, []);

  return (
    <section className="forge-brief-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">Command brief</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">What needs TJ now</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadBrief()}
          className="forge-soft-button"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
          Reading Forge systems...
        </div>
      ) : brief ? (
        <>
          <div className="forge-brief-headline mt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xl font-semibold tracking-[-0.02em] text-zinc-100">{brief.headline}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{brief.nextAction}</p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase ${riskClass(brief.riskLevel)}`}>
                {brief.riskLevel}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="forge-count-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Missions</p>
              <p className="mt-1 text-lg font-semibold">{brief.counts.activeMissions}/{brief.counts.missions}</p>
            </div>
            <div className="forge-count-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Open tasks</p>
              <p className="mt-1 text-lg font-semibold">{brief.counts.openTasks}</p>
            </div>
            <div className="forge-count-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Approvals</p>
              <p className={brief.counts.pendingApprovals ? "mt-1 text-lg font-semibold text-amber-200" : "mt-1 text-lg font-semibold text-emerald-200"}>
                {brief.counts.pendingApprovals}
              </p>
            </div>
            <div className="forge-count-card">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Tools</p>
              <p className="mt-1 text-lg font-semibold">{brief.counts.connectedIntegrations}/{brief.counts.totalIntegrations}</p>
            </div>
          </div>

          {brief.focusMission ? (
            <div className="mt-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-cyan-100">{brief.focusMission.title}</span>
                <span className="text-cyan-200">{brief.focusMission.progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: `${brief.focusMission.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-cyan-100/70">
                {brief.focusMission.openTasks} open tasks • {brief.focusMission.blockedTasks} blocked
              </p>
            </div>
          ) : null}

          {brief.blockers.length ? (
            <div className="mt-3 space-y-2">
              {brief.blockers.map((blocker) => (
                <div key={blocker} className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                  {blocker}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {brief.readiness.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-semibold text-zinc-200">{item.label}</p>
                <p className={item.status === "ready" ? "mt-1 text-xs text-emerald-200" : "mt-1 text-xs text-amber-200"}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
          No command brief yet.
        </div>
      )}
    </section>
  );
}
