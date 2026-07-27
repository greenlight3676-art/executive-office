export type MissionStatus = "planned" | "active" | "blocked" | "review" | "complete";
export type MissionPriority = "low" | "medium" | "high" | "critical";

export type MissionEvent = {
  id: string;
  type: "created" | "updated" | "status_changed" | "assigned";
  message: string;
  createdAt: string;
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  owner: string;
  assignedExecutives: string[];
  status: MissionStatus;
  priority: MissionPriority;
  progress: number;
  createdAt: string;
  updatedAt: string;
  events: MissionEvent[];
};

type CreateMissionInput = {
  title: string;
  description?: string;
  owner?: string;
  assignedExecutives?: string[];
  status?: MissionStatus;
  priority?: MissionPriority;
};

type UpdateMissionInput = Partial<
  Pick<Mission, "title" | "description" | "owner" | "assignedExecutives" | "status" | "priority" | "progress">
>;

const missions = new Map<string, Mission>();

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function now(): string {
  return new Date().toISOString();
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function createEvent(type: MissionEvent["type"], message: string): MissionEvent {
  return {
    id: createId("evt"),
    type,
    message,
    createdAt: now(),
  };
}

export function listMissions(): Mission[] {
  return [...missions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getMission(id: string): Mission | undefined {
  return missions.get(id);
}

export function createMission(input: CreateMissionInput): Mission {
  const createdAt = now();
  const mission: Mission = {
    id: createId("mission"),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    owner: input.owner?.trim() || "TJ",
    assignedExecutives: [...new Set(input.assignedExecutives ?? [])],
    status: input.status ?? "planned",
    priority: input.priority ?? "medium",
    progress: input.status === "complete" ? 100 : 0,
    createdAt,
    updatedAt: createdAt,
    events: [createEvent("created", `Mission created by ${input.owner?.trim() || "TJ"}.`)],
  };

  missions.set(mission.id, mission);
  return mission;
}

export function updateMission(id: string, input: UpdateMissionInput): Mission | undefined {
  const existing = missions.get(id);
  if (!existing) return undefined;

  const previousStatus = existing.status;
  const previousExecutives = existing.assignedExecutives.join(",");

  const updated: Mission = {
    ...existing,
    ...input,
    title: input.title?.trim() || existing.title,
    description: input.description === undefined ? existing.description : input.description.trim(),
    owner: input.owner?.trim() || existing.owner,
    assignedExecutives:
      input.assignedExecutives === undefined
        ? existing.assignedExecutives
        : [...new Set(input.assignedExecutives)],
    progress:
      input.status === "complete"
        ? 100
        : input.progress === undefined
          ? existing.progress
          : clampProgress(input.progress),
    updatedAt: now(),
    events: [...existing.events],
  };

  if (input.status && input.status !== previousStatus) {
    updated.events.push(createEvent("status_changed", `Status changed from ${previousStatus} to ${input.status}.`));
  }

  if (
    input.assignedExecutives &&
    input.assignedExecutives.join(",") !== previousExecutives
  ) {
    updated.events.push(
      createEvent(
        "assigned",
        input.assignedExecutives.length
          ? `Assigned to ${input.assignedExecutives.join(", ")}.`
          : "Executive assignments cleared.",
      ),
    );
  }

  if (!input.status && !input.assignedExecutives) {
    updated.events.push(createEvent("updated", "Mission details updated."));
  }

  missions.set(id, updated);
  return updated;
}

export function deleteMission(id: string): boolean {
  return missions.delete(id);
}

export function seedDefaultMissions(): void {
  if (missions.size > 0) return;

  createMission({
    title: "Complete Forge backend foundation",
    description: "Finish mission tracking, approvals, memory, and integration-ready APIs before expanding the UI.",
    owner: "TJ",
    assignedExecutives: ["Brayko", "Orynth"],
    status: "active",
    priority: "critical",
  });

  createMission({
    title: "Prepare persistent database migration",
    description: "Replace the temporary in-memory mission store with Supabase once the schema is approved.",
    owner: "TJ",
    assignedExecutives: ["Brayko"],
    status: "planned",
    priority: "high",
  });
}
