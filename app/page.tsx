"use client";

import { FormEvent, useMemo, useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ExecutiveStatusPanel } from "@/components/ExecutiveStatusPanel";

export type Provider = "openai" | "claude" | "both";

export type Executive = {
  name: string;
  title: string;
  accent: string;
  status: "Aligned" | "Reviewing" | "Drafting" | "Escalating";
  focus: string;
  nextMove: string;
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const executives: Executive[] = [
  {
    name: "TJ",
    title: "CEO",
    accent: "from-fuchsia-500 to-violet-500",
    status: "Aligned",
    focus: "Board priorities",
    nextMove: "Approve the next high-impact initiative and align the team around it.",
  },
  {
    name: "Brayko",
    title: "Chief Builder",
    accent: "from-cyan-500 to-sky-500",
    status: "Drafting",
    focus: "Product architecture",
    nextMove: "Turn the current mission into a validated build plan with milestones.",
  },
  {
    name: "Lunexa",
    title: "Creative Director",
    accent: "from-amber-500 to-orange-500",
    status: "Reviewing",
    focus: "Brand direction",
    nextMove: "Refine the narrative and visual system for the next launch moment.",
  },
  {
    name: "Vyreel",
    title: "Growth Executive",
    accent: "from-emerald-500 to-lime-500",
    status: "Aligned",
    focus: "Go-to-market",
    nextMove: "Shape the campaign narrative and acquisition motion around the launch.",
  },
  {
    name: "Orynth",
    title: "Operations Executive",
    accent: "from-blue-500 to-indigo-500",
    status: "Escalating",
    focus: "Execution cadence",
    nextMove: "Surface the blockers and route the next decision to the appropriate owner.",
  },
  {
    name: "Kavro",
    title: "Finance Executive",
    accent: "from-rose-500 to-pink-500",
    status: "Reviewing",
    focus: "Forecasting",
    nextMove: "Map the budget and runway assumptions for the next quarter.",
  },
];

const quickPrompts = [
  "Summarize the top priorities for this week.",
  "Draft an operating plan for a new AI product launch.",
  "Prepare a boardroom brief with strategic risks.",
];

export default function Home() {
  const [selectedExecutive, setSelectedExecutive] = useState<Executive>(executives[0]);
  const [provider, setProvider] = useState<Provider>("both");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activityFeed = useMemo(
    () => [
      { label: "Mission Center", detail: "3 initiatives aligned" },
      { label: "Boardroom", detail: "2 active deliberations" },
      { label: "Notifications", detail: "5 approvals pending" },
    ],
    [],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: prompt.trim() },
    ];
    setMessages(nextMessages);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          executive: selectedExecutive.name,
          provider,
        }),
      });

      const payload = await response.json();
      const content = payload.responses?.[0]?.content ?? "No response generated.";
      setMessages([...nextMessages, { role: "assistant", content }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "The executive route is unavailable right now." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.24),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(135deg,_#050816_0%,_#0b1020_45%,_#04070d_100%)] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">FORGE • Executive Office</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">The operating system for ambitious companies.</h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
                A premium command center for leadership, strategy, product, growth, and operations powered by OpenAI and Claude.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
              <div className="font-medium">Boardroom mode active</div>
              <div className="mt-1 text-cyan-100/80">Multiple executives can coordinate around one mission.</div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ExecutiveStatusPanel
            executives={executives}
            activeExecutiveName={selectedExecutive.name}
            onSelect={setSelectedExecutive}
          />

          <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Mission Center</p>
            <ul className="mt-4 space-y-3">
              {activityFeed.map((item) => (
                <li key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-zinc-400">{item.detail}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ActivityFeed />

          <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Provider Selector</p>
                <h2 className="mt-2 text-xl font-semibold">Routing intelligence</h2>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                { key: "both", label: "OpenAI + Claude" },
                { key: "openai", label: "OpenAI only" },
                { key: "claude", label: "Claude only" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setProvider(option.key as Provider)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${provider === option.key ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <span>{option.label}</span>
                  <span className="text-sm text-zinc-400">{provider === option.key ? "Active" : "Standby"}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
              <div className="font-medium text-zinc-200">Future-ready architecture</div>
              <ul className="mt-2 space-y-1">
                <li>• Long-term memory</li>
                <li>• File understanding</li>
                <li>• Voice conversations</li>
                <li>• Tool calling and approvals</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Boardroom Chat</p>
                <h2 className="mt-2 text-xl font-semibold">{selectedExecutive.name} • {selectedExecutive.title}</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300">
                Secure routing
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((promptItem) => (
                  <button
                    key={promptItem}
                    type="button"
                    onClick={() => setPrompt(promptItem)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10"
                  >
                    {promptItem}
                  </button>
                ))}
              </div>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm outline-none ring-0"
                placeholder="Ask the executive team to draft a plan, review a strategy, or prepare a briefing..."
              />

              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Routing..." : "Send to executive layer"}
              </button>
            </form>

            <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                  Launch a mission, review a board update, or route the next decision into the executive stack.
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-2xl border p-3 text-sm ${message.role === "user" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-50" : "border-white/10 bg-white/5 text-zinc-300"}`}
                  >
                    <div className="mb-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                      {message.role === "user" ? "You" : selectedExecutive.name}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
