"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Mission = {
  id: string;
  title: string;
  description?: string;
  status?: MissionStatus;
  priority?: "low" | "medium" | "high";
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
  requiresApproval: boolean;
};

type MissionStatus =
  | "draft"
  | "planned"
  | "active"
  | "blocked"
  | "waiting_approval"
  | "completed"
  | "cancelled"
  | "failed";

type TaskStatus =
  | "todo"
  | "assigned"
  | "working"
  | "blocked"
  | "waiting_approval"
  | "completed"
  | "cancelled"
  | "failed";

const executives = [
  ["orynth", "Orynth"],
  ["brayko", "Brayko"],
  ["lunexa", "Lunexa"],
  ["vyreel", "Vyreel"],
  ["kavro", "Kavro"],
] as const;

const taskStatuses: TaskStatus[] = ["todo", "assigned", "working", "blocked", "waiting_approval", "completed"];
const missionStatuses: MissionStatus[] = ["planned", "active", "blocked", "waiting_approval", "completed"];

export function MissionCenter() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [assignedExecutive, setAssignedExecutive] = useState("orynth");
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedMissionId) ?? missions[0],
    [missions, selectedMissionId],
  );

  async function loadMissions() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/missions", { cache: "no-store" });
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

  async function loadTasks(missionId: string) {
    if (!missionId) {
      setTasks([]);
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/missions/${missionId}/tasks`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load tasks.");
      setTasks(Array.isArray(payload.tasks) ? payload.tasks : []);
    } catch (loadError) {
      setTasks([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load tasks.");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadMissions);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadTasks(selectedMission?.id ?? ""));
  }, [selectedMission?.id]);

  async function createMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || isCreatingMission) return;

    setIsCreatingMission(true);
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
          assignedExecutives: [assignedExecutive],
          priority: "medium",
          status: "planned",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create mission.");
      setMissions((current) => [payload.mission, ...current]);
      setSelectedMissionId(payload.mission.id);
      setTitle("");
      setDescription("");
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

    try {
      const response = await fetch(`/api/missions/${selectedMission.id}/tasks`, {
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
      setTasks((current) => [...current, payload.task]);
      setTaskTitle("");
      setTaskDescription("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create task.");
    } finally {
      setIsCreatingTask(false);
    }
  }

  async function updateMissionStatus(status: MissionStatus) {
    if (!selectedMission) return;
    setError("");

    try {
      const response = await fetch(`/api/missions/${selectedMission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update mission.");
      setMissions((current) =>
        current.map((mission) => (mission.id === payload.mission.id ? payload.mission : mission)),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update mission.");
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setError("");

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update task.");
      setTasks((current) => current.map((task) => (task.id === payload.task.id ? payload.task : task)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Mission Control</p>
          <h2 className="mt-1 text-xl font-semibold">Missions and tasks</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadMissions()}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={createMission} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_140px_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Mission title"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Mission description"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
        />
        <select
          value={assignedExecutive}
          onChange={(event) => setAssignedExecutive(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
        >
          {executives.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!title.trim() || isCreatingMission}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40"
        >
          {isCreatingMission ? "Creating..." : "Create"}
        </button>
      </form>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-400">Loading...</div>
          ) : missions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-zinc-400">
              No missions yet.
            </div>
          ) : (
            missions.map((mission) => (
              <button
                key={mission.id}
                type="button"
                onClick={() => setSelectedMissionId(mission.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm ${
                  selectedMission?.id === mission.id
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="font-medium text-zinc-100">{mission.title}</div>
                <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{mission.description || "No description"}</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{mission.status ?? "planned"}</div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          {selectedMission ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedMission.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{selectedMission.description || "No description"}</p>
                </div>
                <select
                  value={selectedMission.status ?? "planned"}
                  onChange={(event) => void updateMissionStatus(event.target.value as MissionStatus)}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
                >
                  {missionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={createTask} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_140px_auto]">
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Task title"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
                />
                <input
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  placeholder="Task detail"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
                />
                <select
                  value={assignedExecutive}
                  onChange={(event) => setAssignedExecutive(event.target.value)}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
                >
                  {executives.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!taskTitle.trim() || isCreatingTask}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-40"
                >
                  {isCreatingTask ? "Adding..." : "Add task"}
                </button>
              </form>

              <div className="mt-4 space-y-2">
                {tasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-zinc-500">
                    No tasks yet.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <article key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {task.assignedExecutive} • {task.description || "No detail"}
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(event) => void updateTaskStatus(task.id, event.target.value as TaskStatus)}
                          className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs outline-none"
                        >
                          {taskStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="p-3 text-sm text-zinc-500">Create or select a mission.</div>
          )}
        </div>
      </div>
    </section>
  );
}
