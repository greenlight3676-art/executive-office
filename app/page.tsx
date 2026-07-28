"use client";

import Link from "next/link";
import { ApprovalInbox } from "@/components/ApprovalInbox";
import { AuthGate } from "@/components/AuthGate";
import { BoardroomPanel } from "@/components/BoardroomPanel";
import { IntegrationsPanel } from "@/components/IntegrationsPanel";
import { MissionCenter } from "@/components/MissionCenter";
import { SystemHealthPanel } from "@/components/SystemHealthPanel";

const quickActions = [
  { label: "New mission", href: "#projects", icon: "＋", detail: "Plan and assign work" },
  { label: "Board room", href: "#board", icon: "◈", detail: "Get one final decision" },
  { label: "Approvals", href: "#approvals", icon: "✓", detail: "Review before execution" },
  { label: "Connections", href: "#settings", icon: "⌁", detail: "Manage tools" },
];

export default function Home() {
  return (
    <AuthGate>
      <main className="forge-shell min-h-screen bg-[#07070a] text-white">
        <div className="mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pb-10">
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">Forge</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Good afternoon, TJ 👋</h1>
            </div>
            <Link
              href="#settings"
              aria-label="Open settings"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-lg active:scale-95"
            >
              ⚙
            </Link>
          </header>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.035] p-4 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/55">What are we building today?</p>
                <p className="mt-1 text-lg font-semibold">Tell Forge what to handle.</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                Ready
              </span>
            </div>

            <Link
              href="/messages"
              className="mt-5 flex min-h-24 items-center justify-center gap-3 rounded-[24px] bg-white text-zinc-950 shadow-lg shadow-white/10 transition active:scale-[0.98]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-zinc-950 text-xl text-white">🎙</span>
              <span className="text-left">
                <span className="block text-lg font-semibold">Hold to speak</span>
                <span className="block text-xs text-zinc-500">or tap to open executive chat</span>
              </span>
            </Link>
          </section>

          <section className="mt-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Quick actions</p>
                <p className="mt-1 text-xs text-white/40">Everything important, one tap away.</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="min-h-32 rounded-[24px] border border-white/10 bg-white/[0.055] p-4 transition active:scale-[0.98] active:bg-white/10"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-xl">{action.icon}</span>
                  <span className="mt-4 block text-sm font-semibold">{action.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/40">{action.detail}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Recent activity</p>
                <p className="mt-1 text-xs text-white/40">Your latest Forge moves</p>
              </div>
              <span className="text-xs text-white/35">Live</span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-2xl bg-black/20 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">✓</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">Forge systems online</p>
                  <p className="text-xs text-white/35">OpenAI, Claude, Supabase and persistence</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-black/20 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-400/10 text-fuchsia-300">◈</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">Board room ready</p>
                  <p className="text-xs text-white/35">Run only when a mission needs every executive</p>
                </div>
              </div>
            </div>
          </section>

          <section id="projects" className="scroll-mt-6 pt-7">
            <details className="forge-disclosure" open>
              <summary>
                <span>
                  <small>Projects</small>
                  <strong>Missions & tasks</strong>
                </span>
                <span className="forge-chevron">⌄</span>
              </summary>
              <div className="forge-panel-content"><MissionCenter /></div>
            </details>
          </section>

          <section id="approvals" className="scroll-mt-6 pt-4">
            <details className="forge-disclosure">
              <summary>
                <span>
                  <small>Inbox</small>
                  <strong>Approvals</strong>
                </span>
                <span className="forge-chevron">⌄</span>
              </summary>
              <div className="forge-panel-content"><ApprovalInbox /></div>
            </details>
          </section>

          <section id="board" className="scroll-mt-6 pt-4">
            <details className="forge-disclosure">
              <summary>
                <span>
                  <small>Executives</small>
                  <strong>Board room</strong>
                </span>
                <span className="forge-chevron">⌄</span>
              </summary>
              <div className="forge-panel-content"><BoardroomPanel /></div>
            </details>
          </section>

          <section id="settings" className="scroll-mt-6 pt-4">
            <details className="forge-disclosure">
              <summary>
                <span>
                  <small>Advanced</small>
                  <strong>Connections & system</strong>
                </span>
                <span className="forge-chevron">⌄</span>
              </summary>
              <div className="forge-panel-content space-y-4">
                <SystemHealthPanel />
                <IntegrationsPanel />
              </div>
            </details>
          </section>
        </div>

        <nav className="forge-tabbar fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center justify-around rounded-[24px] border border-white/10 bg-zinc-950/90 px-2 py-2 shadow-2xl shadow-black/60 backdrop-blur-xl sm:hidden">
          <a href="#top" className="forge-tab"><span>⌂</span><small>Home</small></a>
          <a href="#projects" className="forge-tab"><span>▣</span><small>Projects</small></a>
          <Link href="/messages" className="forge-tab forge-tab-primary"><span>🎙</span><small>Talk</small></Link>
          <a href="#board" className="forge-tab"><span>◈</span><small>Board</small></a>
          <a href="#settings" className="forge-tab"><span>⚙</span><small>Settings</small></a>
        </nav>
      </main>
    </AuthGate>
  );
}
