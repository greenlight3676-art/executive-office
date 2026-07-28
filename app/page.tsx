"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BoardroomPanel } from "@/components/BoardroomPanel";
import { ExecutiveStatusPanel } from "@/components/ExecutiveStatusPanel";
import { MissionCenter } from "@/components/MissionCenter";

export type Executive = {
  name: string;
  title: string;
  accent: string;
  status: "Aligned" | "Reviewing" | "Drafting" | "Escalating";
  focus: string;
  nextMove: string;
};

const executives: Executive[] = [
  { name: "TJ", title: "CEO", accent: "from-fuchsia-500 to-violet-500", status: "Aligned", focus: "Board priorities", nextMove: "Approve the next high-impact initiative and align the team around it." },
  { name: "Brayko", title: "Chief Builder", accent: "from-cyan-500 to-sky-500", status: "Drafting", focus: "Product architecture", nextMove: "Turn the current mission into a validated build plan with milestones." },
  { name: "Lunexa", title: "Creative Director", accent: "from-amber-500 to-orange-500", status: "Reviewing", focus: "Brand direction", nextMove: "Refine the narrative and visual system for the next launch moment." },
  { name: "Vyreel", title: "Growth Executive", accent: "from-emerald-500 to-lime-500", status: "Aligned", focus: "Go-to-market", nextMove: "Shape the campaign narrative and acquisition motion around the launch." },
  { name: "Orynth", title: "Operations Executive", accent: "from-blue-500 to-indigo-500", status: "Escalating", focus: "Execution cadence", nextMove: "Surface blockers and route the next decision to the appropriate owner." },
  { name: "Kavro", title: "Finance Executive", accent: "from-rose-500 to-pink-500", status: "Reviewing", focus: "Forecasting", nextMove: "Map the budget and runway assumptions for the next quarter." },
];

export default function Home() {
  const [selectedExecutive, setSelectedExecutive] = useState<Executive>(executives[0]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.24),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(135deg,_#050816_0%,_#0b1020_45%,_#04070d_100%)] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">FORGE • Executive Office</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Build, assign, and move.</h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">Your command center saves real missions, routes direct executive work, and now runs full board meetings.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/messages"
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
              >
                Open Messages
              </Link>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                <div className="font-medium">Executive layer online</div>
                <div className="mt-1 text-emerald-100/80">Missions, identities, and conversations are connected.</div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ExecutiveStatusPanel executives={executives} activeExecutiveName={selectedExecutive.name} onSelect={setSelectedExecutive} />
          <MissionCenter />
        </section>

        <BoardroomPanel />

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <ActivityFeed />
            <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Model routing</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
                  <span>OpenAI</span>
                  <span className="text-xs text-cyan-200">Orynth • Vyreel • Kavro</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3">
                  <span>Claude</span>
                  <span className="text-xs text-fuchsia-200">Brayko • Lunexa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Executive Messages</p>
            <h2 className="mt-2 text-2xl font-semibold">One inbox. Five separate brains.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Talk privately with Brayko, Lunexa, Vyreel, Orynth, or Kavro. Each thread now keeps its conversation history and executive-specific memory.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Saved threads", "Return to past decisions without restarting."],
                ["Real identities", "Every executive answers from a distinct mandate and style."],
                ["Persistent memory", "Relevant preferences and decisions carry into future briefings."],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-medium text-zinc-100">{title}</div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">{detail}</div>
                </div>
              ))}
            </div>

            <Link
              href="/messages"
              className="mt-5 block w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
            >
              Message an executive →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
