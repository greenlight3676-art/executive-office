"use client";

import { FormEvent, useEffect, useState } from "react";

type Mission = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
};

export function MissionCenter() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMissions() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/missions", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load missions.");
      }

      setMissions(Array.isArray(payload.missions) ? payload.missions : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load missions.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMissions();
  }, []);

  async function createMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          projectId: "forge",
          createdBy: "tj",
          assignedExecutives: [],
          priority: "medium",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create mission.");
      }

      setMissions((current) => [payload.mission, ...current]);
      setTitle("");
      setDescription("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create mission.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Mission Center</p>
          <h2 className="mt-2 text-xl font-semibold">Real projects, saved</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadMissions()}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={createMission} className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New project or mission name"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-400/40"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="What should Forge accomplish?"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-400/40"
        />
        <button
          type="submit"
          disabled={!title.trim() || isCreating}
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "+ Create mission"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">Loading missions...</div>
        ) : missions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            No missions yet. Create the first real Forge project above.
          </div>
        ) : (
          missions.map((mission) => (
            <article key={mission.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-zinc-100">{mission.title}</h3>
                  {mission.description ? <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{mission.description}</p> : null}
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-cyan-200">
                  {mission.status ?? "active"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>Priority: {mission.priority ?? "medium"}</span>
                <span>Saved</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
