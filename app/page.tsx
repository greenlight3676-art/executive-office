"use client";

import Link from "next/link";
import { ApprovalInbox } from "@/components/ApprovalInbox";
import { AuthGate } from "@/components/AuthGate";
import { BoardroomPanel } from "@/components/BoardroomPanel";
import { CommandBriefPanel } from "@/components/CommandBriefPanel";
import { IntegrationsPanel } from "@/components/IntegrationsPanel";
import { MissionCenter } from "@/components/MissionCenter";
import { SystemHealthPanel } from "@/components/SystemHealthPanel";

const quickActions = [
  { label: "Mission", href: "#projects", icon: "＋", detail: "Start work" },
  { label: "Board", href: "#board", icon: "◈", detail: "Vote + decide" },
  { label: "Approve", href: "#approvals", icon: "✓", detail: "Review actions" },
  { label: "Tools", href: "#settings", icon: "⌁", detail: "Connections" },
];

const executives = [
  { name: "Orynth", role: "Chief brain", tone: "Strategy", value: 92 },
  { name: "Brayko", role: "Builder", tone: "Code", value: 84 },
  { name: "Lunexa", role: "Design", tone: "Brand", value: 77 },
  { name: "Vyreel", role: "Growth", tone: "Social", value: 69 },
  { name: "Kavro", role: "Money", tone: "Ops", value: 73 },
];

export default function Home() {
  return (
    <AuthGate>
      <main className="forge-shell min-h-screen bg-[#07070a] text-white">
        <div className="forge-mobile-frame mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pb-10">
          <header className="forge-topbar sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 px-4 py-3 sm:static sm:mx-0 sm:px-0">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/60">Forge OS</p>
              <h1 className="mt-1 truncate text-[22px] font-semibold tracking-tight sm:text-2xl">Executive Office</h1>
            </div>
            <Link
              href="#settings"
              aria-label="Open settings"
              className="forge-icon-button"
            >
              ⚙
            </Link>
          </header>

          <section className="forge-hero-card mt-4 p-4 sm:mt-6 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="forge-live-pill">
                  <span className="forge-pulse-dot" />
                  Command layer online
                </div>
                <h2 className="mt-5 max-w-2xl text-[34px] font-semibold leading-[0.96] tracking-[-0.04em] sm:text-6xl">
                  Build. Decide. Execute.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                  Your five-executive AI office for missions, approvals, tools, and boardroom calls.
                </p>
              </div>
              <div className="forge-orb hidden sm:grid">
                <span>F</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1.15fr_.85fr]">
              <Link href="/messages" className="forge-primary-command">
                <span className="forge-command-icon">🎙</span>
                <span>
                  <span className="block text-lg font-semibold">Open Executive Chat</span>
                  <span className="mt-1 block text-xs text-zinc-500">Talk to the office, create missions, route tools.</span>
                </span>
              </Link>

              <div className="forge-status-stack">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">Today</span>
                  <p className="mt-1 text-sm font-medium text-white">Ready for orders</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="forge-mini-stat"><strong>5</strong><span>execs</span></div>
                  <div className="forge-mini-stat"><strong>24/7</strong><span>ops</span></div>
                  <div className="forge-mini-stat"><strong>CEO</strong><span>gated</span></div>
                </div>
              </div>
            </div>
          </section>

          <section className="forge-exec-rail mt-4">
            {executives.map((executive) => (
              <article key={executive.name} className="forge-exec-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{executive.name}</p>
                    <p className="text-[11px] text-white/38">{executive.role}</p>
                  </div>
                  <span>{executive.tone}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-200" style={{ width: `${executive.value}%` }} />
                </div>
              </article>
            ))}
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
            <CommandBriefPanel />

            <section className="forge-action-panel">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Fast moves</p>
                  <h2 className="mt-1 text-xl font-semibold">Launch pad</h2>
                </div>
              </div>

              <div className="forge-quick-grid mt-4 grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href} className="forge-action-tile">
                    <span>{action.icon}</span>
                    <strong>{action.label}</strong>
                    <small>{action.detail}</small>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <section className="forge-activity-strip mt-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Live pulse</p>
              <h2 className="mt-1 text-lg font-semibold">Systems are standing by</h2>
            </div>
            <div className="forge-activity-items">
              <span>OpenAI ready</span>
              <span>Board room online</span>
              <span>Approval gates active</span>
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
