"use client";

import Link from "next/link";
import { BoardroomPanel } from "@/components/BoardroomPanel";
import { MissionCenter } from "@/components/MissionCenter";

const checks = [
  { label: "Health", href: "/api/ai/health" },
  { label: "Executives", href: "/api/executives" },
  { label: "Missions API", href: "/api/missions" },
  { label: "Messages", href: "/messages" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Forge Phase 1</p>
          <h1 className="mt-2 text-2xl font-semibold">Backend test console</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Plain UI for checking messages, memory, missions, and boardroom calls before polishing the layout.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {checks.map((check) => (
              <Link
                key={check.href}
                href={check.href}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm text-zinc-200 transition hover:bg-white/10"
              >
                {check.label}
              </Link>
            ))}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <MissionCenter />
          <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Message Test</p>
            <h2 className="mt-2 text-xl font-semibold">Check executive chat</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Send a message, refresh, and confirm the thread stays saved.
            </p>
            <Link
              href="/messages"
              className="mt-4 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Open Messages
            </Link>
          </div>
        </section>

        <BoardroomPanel />
      </div>
    </main>
  );
}
