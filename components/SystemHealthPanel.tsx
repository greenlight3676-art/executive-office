"use client";

import { useEffect, useState } from "react";

type Health = {
  openai?: { configured: boolean };
  anthropic?: { configured: boolean };
};

type Storage = {
  persistence?: "supabase" | "memory";
  supabaseConfigured?: boolean;
};

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400" : "bg-rose-400"}`} />;
}

export function SystemHealthPanel() {
  const [health, setHealth] = useState<Health | null>(null);
  const [storage, setStorage] = useState<Storage | null>(null);
  const [error, setError] = useState("");

  async function loadHealth() {
    setError("");

    try {
      const [aiResponse, storageResponse] = await Promise.all([
        fetch("/api/ai/health", { cache: "no-store" }),
        fetch("/api/system/storage", { cache: "no-store" }),
      ]);
      const [aiPayload, storagePayload] = await Promise.all([
        aiResponse.json(),
        storageResponse.json(),
      ]);
      if (!aiResponse.ok) throw new Error(aiPayload.error ?? "AI health failed.");
      if (!storageResponse.ok) throw new Error(storagePayload.error ?? "Storage health failed.");
      setHealth(aiPayload);
      setStorage(storagePayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load system health.");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadHealth);
  }, []);

  const rows = [
    ["OpenAI", Boolean(health?.openai?.configured)],
    ["Claude", Boolean(health?.anthropic?.configured)],
    ["Supabase", Boolean(storage?.supabaseConfigured)],
    ["Persistence", storage?.persistence === "supabase"],
  ] as const;

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">System</p>
          <h2 className="mt-1 text-xl font-semibold">Health check</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadHealth()}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300"
        >
          Refresh
        </button>
      </div>

      {error ? <div className="mt-4 text-sm text-rose-200">{error}</div> : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, ok]) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="text-sm text-zinc-300">{label}</span>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <StatusDot ok={ok} />
              {ok ? "ok" : "check"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
