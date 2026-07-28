import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { IntegrationsPanel } from "@/components/IntegrationsPanel";

export default function IntegrationsPage() {
  return (
    <AuthGate>
      <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Forge Phase 4</p>
              <h1 className="mt-2 text-2xl font-semibold">Tool connections</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Give executives a controlled map of what they can use and what still needs setup.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-center text-sm text-zinc-300 transition hover:bg-white/10"
            >
              Back
            </Link>
          </header>

          <IntegrationsPanel />
        </div>
      </main>
    </AuthGate>
  );
}