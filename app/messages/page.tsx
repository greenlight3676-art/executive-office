import Link from "next/link";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { listExecutiveAgents, resolveExecutiveProvider } from "@/lib/ai/router";
import { AuthGate } from "@/components/AuthGate";
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
    <AuthGate>
      <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Forge Operator</p>
              <h1 className="mt-2 text-2xl font-semibold">Executive command chat</h1>
            </div>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-center text-sm text-zinc-300 transition hover:bg-white/10"
            >
              Back
            </Link>
          </header>

          <MessagesWorkspace executives={executives} />
        </div>
      </main>
    </AuthGate>
  );
}