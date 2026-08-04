"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/auth/browser";

type MissionStatus = "draft" | "planned" | "active" | "blocked" | "waiting_approval" | "completed" | "cancelled" | "failed";
type TaskStatus = "todo" | "assigned" | "working" | "blocked" | "waiting_approval" | "completed" | "cancelled" | "failed";

type Mission = {
  id: string;
  title: string;
  description?: string;
  status: MissionStatus;
  priority: "low" | "medium" | "high";
  assignedExecutives?: string[];
  createdAt?: string;
};

type Task = {
  id: string;
  missionId: string;
  title: string;
  description?: string;
  assignedExecutive: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dependencyIds: string[];
  requiresApproval: boolean;
  approvalRequestId?: string;
  updatedAt?: string;
};

type MissionSnapshot = {
  mission: Mission;
  tasks: Task[];
  progress: number;
  counts: {
    total: number;
    completed: number;
    working: number;
    blocked: number;
    waitingApproval: number;
    failed: number;
    remaining: number;
  };
  stuck: boolean;
  stuckTaskIds: string[];
  lastActivityAt: string;
};

const executives = [
  ["orynth", "Orynth"],
  ["brayko", "Brayko"],
  ["lunexa", "Lunexa"],
  ["vyreel", "Vyreel"],
  ["kavro", "Kavro"],
] as const;

const taskStatuses: TaskStatus[] = ["todo", "assigned", "working", "blocked", "waiting_approval", "completed", "cancelled", "failed"];
const missionStatuses: MissionStatus[] = ["planned", "active", "blocked", "waiting_approval", "completed", "cancelled", "failed"];

function executiveName(id: string) {
  return executives.find(([executiveId]) => executiveId === id)?.[1] ?? id;
}

export function MissionCenter() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [snapshot, setSnapshot] = useState<MissionSnapshot | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [assignedExecutive, setAssignedExecutive] = useState("orynth");
  const [autoPlanMission, setAutoPlanMission] = useState(true);
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedMissionId) ?? snapshot?.mission ?? missions[0],
    [missions, selectedMissionId, snapshot],
  );

  async function loadMissions() {
    setIsLoading(true);
    setError("");
    try {
      const response = await authFetch("/api/missions", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load missions.");
      const nextMissions = Array.isArray(payload.missions) ? payload.missions : [];
      setMissions(nextMissions);
      setSelectedMissionId((current) => current || nextMissions[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load missions.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSnapshot(missionId: string) {
    if (!missionId) {
      setSnapshot(null);
      return;
    }
    setError("");
    try {
      const response = await authFetch(`/api/missions/${missionId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load mission.");
      setSnapshot(payload as MissionSnapshot);
      setMissions((current) => current.map((mission) => (mission.id === payload.mission.id ? payload.mission : mission)));
    } catch (loadError) {
      setSnapshot(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load mission.");
    }
  }

  useEffect(() => {
    void loadMissions();
  }, []);

  useEffect(() => {
    void loadSnapshot(selectedMissionId);
  }, [selectedMissionId]);

  async function createMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || isCreatingMission) return;
    setIsCreatingMission(true);
    setError("");
    setNotice("");
    try {
      const response = await authFetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          projectId: "forge",
          createdBy: "tj",
          assignedExecutives: [assignedExecutive],
          priority: "medium",
          status: "planned",
          autoPlan: autoPlanMission,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create mission.");
      setMissions((current) => [payload.mission, ...current]);
      setSelectedMissionId(payload.mission.id);
      setTitle("");
      setDescription("");
      setNotice(`Mission created with ${Array.isArray(payload.tasks) ? payload.tasks.length : 0} planned tasks.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create mission.");
    } finally {
      setIsCreatingMission(false);
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMission || !taskTitle.trim() || isCreatingTask) return;
    setIsCreatingTask(true);
    setError("");
    setNotice("");
    try {
      const response = await authFetch(`/api/missions/${selectedMission.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          assignedExecutive,
          priority: "medium",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create task.");
      setTaskTitle("");
      setTaskDescription("");
      await loadSnapshot(selectedMission.id);
      setNotice("Task added to the mission.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create task.");
    } finally {
      setIsCreatingTask(false);
    }
  }

  async function updateMissionStatus(status: MissionStatus) {
    if (!selectedMission) return;
    setError("");
    setNotice("");
    try {
      const response = await authFetch(`/api/missions/${selectedMission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update mission.");
      setSnapshot(payload as MissionSnapshot);
      setMissions((current) => current.map((mission) => (mission.id === payload.mission.id ? payload.mission : mission)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update mission.");
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    if (!selectedMission) return;
    setError("");
    setNotice("");
    try {
      const response = await authFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update task.");
      await loadSnapshot(selectedMission.id);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    }
  }

  async function advanceMission() {
    if (!selectedMission || isAdvancing) return;
    setIsAdvancing(true);
    setError("");
    setNotice("");
    try {
      const response = await authFetch(`/api/missions/${selectedMission.id}/advance`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to advance mission.");
      setSnapshot(payload.snapshot as MissionSnapshot);
      setMissions((current) => current.map((mission) => (mission.id === payload.snapshot.mission.id ? payload.snapshot.mission : mission)));
      setNotice(payload.message ?? "Mission advanced.");
    } catch (advanceError) {
      setError(advanceError instanceof Error ? advanceError.message : "Unable to advance mission.");
    } finally {
      setIsAdvancing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Mission Control</p>
          <h2 className="mt-1 text-xl font-semibold">Autonomous mission engine</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadMissions()} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">Refresh</button>
          <button type="button" disabled={!selectedMission || isAdvancing} onClick={() => void advanceMission()} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-40">
            {isAdvancing ? "Running..." : "Run next step"}
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div> : null}
      {notice ? <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</div> : null}

      <form onSubmit={createMission} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_140px_auto]">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mission title" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" />
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mission description" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" />
        <select value={assignedExecutive} onChange={(event) => setAssignedExecutive(event.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none">
          {executives.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <button type="submit" disabled={!title.trim() || isCreatingMission} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40">{isCreatingMission ? "Creating..." : "Create"}</button>
      </form>
      <label className="mt-2 flex w-fit items-center gap-2 text-xs text-zinc-400">
        <input type="checkbox" checked={autoPlanMission} onChange={(event) => setAutoPlanMission(event.target.checked)} className="h-4 w-4 rounded border-white/10 bg-black/30" />
        Auto-plan and assign executive tasks
      </label>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="max-h-[560px] space-y-2 overflow-y-auto">
          {isLoading ? <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-400">Loading...</div> : missions.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-zinc-400">No missions yet.</div> : missions.map((mission) => (
            <button key={mission.id} type="button" onClick={() => setSelectedMissionId(mission.id)} className={`w-full rounded-xl border p-3 text-left text-sm ${selectedMission?.id === mission.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-black/20"}`}>
              <div className="font-medium text-zinc-100">{mission.title}</div>
              <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{mission.description || "No description"}</div>
              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-500"><span>{mission.status}</span><span>{mission.priority}</span></div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          {selectedMission && snapshot ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{snapshot.mission.title}</h3>
                    {snapshot.stuck ? <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-200">Needs attention</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{snapshot.mission.description || "No description"}</p>
                </div>
                <select value={snapshot.mission.status} onChange={(event) => void updateMissionStatus(event.target.value as MissionStatus)} className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none">
                  {missionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${snapshot.progress}%` }} /></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <Metric label="Progress" value={`${snapshot.progress}%`} />
                <Metric label="Completed" value={`${snapshot.counts.completed}/${snapshot.counts.total}`} />
                <Metric label="Working" value={String(snapshot.counts.working)} />
                <Metric label="Approvals" value={String(snapshot.counts.waitingApproval)} warning={snapshot.counts.waitingApproval > 0} />
              </div>

              <form onSubmit={createTask} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_140px_auto]">
                <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none" />
                <input value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Task detail" className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none" />
                <select value={assignedExecutive} onChange={(event) => setAssignedExecutive(event.target.value)} className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none">
                  {executives.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                <button type="submit" disabled={!taskTitle.trim() || isCreatingTask} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-40">{isCreatingTask ? "Adding..." : "Add task"}</button>
              </form>

              <div className="mt-4 space-y-2">
                {snapshot.tasks.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-zinc-500">No tasks yet.</div> : snapshot.tasks.map((task) => {
                  const isStuck = snapshot.stuckTaskIds.includes(task.id);
                  return (
                    <article key={task.id} className={`rounded-xl border p-3 ${isStuck ? "border-amber-300/30 bg-amber-300/5" : "border-white/10 bg-white/5"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{task.title}</div>
                            {task.requiresApproval ? <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-fuchsia-200">Approval</span> : null}
                            {isStuck ? <span className="text-[10px] uppercase tracking-wide text-amber-200">Stuck</span> : null}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">{executiveName(task.assignedExecutive)} • {task.description || "No detail"}</div>
                          {task.dependencyIds.length > 0 ? <div className="mt-1 text-[11px] text-zinc-600">Depends on {task.dependencyIds.length} task{task.dependencyIds.length === 1 ? "" : "s"}</div> : null}
                          {task.approvalRequestId ? <div className="mt-1 text-[11px] text-fuchsia-200/70">Approval request created</div> : null}
                        </div>
                        <select value={task.status} onChange={(event) => void updateTaskStatus(task.id, event.target.value as TaskStatus)} className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs outline-none">
                          {taskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : <div className="p-3 text-sm text-zinc-500">Create or select a mission.</div>}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${warning ? "text-amber-200" : "text-zinc-100"}`}>{value}</p>
    </div>
  );
}
