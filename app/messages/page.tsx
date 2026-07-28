import Link from "next/link";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { listExecutiveAgents, resolveExecutiveProvider } from "@/lib/ai/router";
import { MessagesWorkspace } from "@/components/MessagesWorkspace";

export default function MessagesPage() {
  const providerConfig = getProviderConfig(process.env);
  const executives = listExecutiveAgents().map((executive) => ({
    id: executive.id,
    name: executive.name,
    symbol: executive.symbol,
    role: executive.role,
    mandate: executive.mandate,
    motto: executive.motto,
    communicationStyle: executive.communicationStyle,
    accent: executive.accent,
    activeProvider: resolveExecutiveProvider(executive.id, providerConfig).name,
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(217,70,239,0.18),_transparent_28%),linear-gradient(135deg,_#050816_0%,_#0b1020_45%,_#04070d_100%)] px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-cyan-300">
              <span>FORGE</span>
              <span className="text-zinc-700">/</span>
              <span>Messages</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Your executive inbox.</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Every executive has a distinct brain, saved conversations, and memory that carries into the next briefing.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-zinc-300 transition hover:bg-white/10"
          >
            ← Command Center
          </Link>
        </header>

        <MessagesWorkspace executives={executives} />
      </div>
    </main>
  );
}
