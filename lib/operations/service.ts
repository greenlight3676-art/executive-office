import { randomUUID } from "crypto";
import { createMissionTaskPlan, MissionIntent } from "@/lib/missions/planner";
import {
  MissionRecord,
  MissionRepository,
  MissionStatus,
  TaskRecord,
  TaskRepository,
  TaskStatus,
} from "@/lib/repositories/types";

const EXECUTIVES = ["orynth", "brayko", "lunexa", "vyreel", "kavro"] as const;
const MISSION_STATUSES: MissionStatus[] = [
  "draft",
  "planned",
  "active",
  "blocked",
  "waiting_approval",
  "completed",
  "cancelled",
  "failed",
];
const TASK_STATUSES: TaskStatus[] = [
  "todo",
  "assigned",
  "working",
  "blocked",
  "waiting_approval",
  "completed",
  "cancelled",
  "failed",
];
const DEFAULT_STUCK_AFTER_MS = 30 * 60 * 1000;

export interface MissionServiceDependencies {
  missions: MissionRepository;
  tasks: TaskRepository;
}

export interface CreateMissionInput {
  title: string;
  description: string;
  projectId: string;
  createdBy: string;
  assignedExecutives: string[];
  priority: "low" | "medium" | "high";
  status?: MissionStatus;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assignedExecutive: string;
  priority: "low" | "medium" | "high";
  dependencyIds?: string[];
  requiresApproval?: boolean;
  approvalRequestId?: string;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

export type MissionSnapshot = {
  mission: MissionRecord;
  tasks: TaskRecord[];
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

export class MissionService {
  constructor(private readonly deps: MissionServiceDependencies) {}

  async createMission(input: CreateMissionInput) {
    this.assertValidExecutiveList(input.assignedExecutives);
    this.assertMissionStatus(input.status ?? "planned");
    this.assertText(input.title, "Mission title");

    const now = new Date().toISOString();
    const mission: MissionRecord = {
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      projectId: input.projectId,
      createdBy: input.createdBy,
      assignedExecutives: input.assignedExecutives,
      status: input.status ?? "planned",
      priority: input.priority,
      createdAt: now,
      updatedAt: now,
      dueAt: input.dueAt,
      metadata: input.metadata,
    };

    return this.deps.missions.create(mission);
  }

  async createMissionWithPlan(input: CreateMissionInput & { intent?: MissionIntent }) {
    const mission = await this.createMission(input);
    const taskPlan = input.intent ? createMissionTaskPlan(input.intent) : [];
    const tasks: TaskRecord[] = [];

    for (const [index, task] of taskPlan.entries()) {
      tasks.push(
        await this.createTask(mission.id, {
          ...task,
          dependencyIds: [],
          requiresApproval: task.requiresApproval ?? false,
          metadata: {
            source: "mission-planner",
            missionTitle: mission.title,
            planOrder: index + 1,
          },
        }),
      );
    }

    return this.reconcileMission(mission.id);
  }

  async getMission(id: string) {
    return this.deps.missions.get(id);
  }

  async listMissions() {
    return this.deps.missions.list();
  }

  async updateMission(id: string, updates: Partial<CreateMissionInput>) {
    if (updates.assignedExecutives) this.assertValidExecutiveList(updates.assignedExecutives);
    if (updates.status) this.assertMissionStatus(updates.status);
    if (updates.title !== undefined) this.assertText(updates.title, "Mission title");

    return this.deps.missions.update(id, {
      ...updates,
      title: updates.title?.trim(),
      description: updates.description?.trim(),
      updatedAt: new Date().toISOString(),
    });
  }

  async createTask(missionId: string, input: CreateTaskInput) {
    const mission = await this.deps.missions.get(missionId);
    if (!mission) throw new Error("Mission not found");
    if (["completed", "cancelled", "failed"].includes(mission.status)) {
      throw new Error("Cannot add tasks to a closed mission.");
    }

    this.assertExecutive(input.assignedExecutive);
    this.assertText(input.title, "Task title");
    await this.assertDependenciesExist(missionId, input.dependencyIds ?? []);

    const now = new Date().toISOString();
    const task: TaskRecord = {
      id: randomUUID(),
      missionId,
      title: input.title.trim(),
      description: input.description.trim(),
      assignedExecutive: input.assignedExecutive,
      status: "todo",
      priority: input.priority,
      dependencyIds: [...new Set(input.dependencyIds ?? [])],
      requiresApproval: input.requiresApproval ?? false,
      approvalRequestId: input.approvalRequestId,
      createdAt: now,
      updatedAt: now,
      dueAt: input.dueAt,
      metadata: input.metadata,
    };

    const created = await this.deps.tasks.create(task);
    await this.reconcileMission(missionId);
    return created;
  }

  async listTasks(missionId: string) {
    return this.deps.tasks.listByMission(missionId);
  }

  async updateTask(id: string, updates: Partial<CreateTaskInput> & { status?: TaskStatus }) {
    const task = await this.deps.tasks.get(id);
    if (!task) throw new Error("Task not found");

    if (updates.status) {
      this.assertTaskStatus(updates.status);
      await this.assertTaskCanEnterStatus(task, updates.status, updates.approvalRequestId);
    }
    if (updates.assignedExecutive) this.assertExecutive(updates.assignedExecutive);
    if (updates.title !== undefined) this.assertText(updates.title, "Task title");
    if (updates.dependencyIds) await this.assertDependenciesExist(task.missionId, updates.dependencyIds, task.id);

    const updated = await this.deps.tasks.update(id, {
      ...updates,
      title: updates.title?.trim(),
      description: updates.description?.trim(),
      dependencyIds: updates.dependencyIds ? [...new Set(updates.dependencyIds)] : undefined,
      updatedAt: new Date().toISOString(),
    });

    await this.reconcileMission(task.missionId);
    return updated;
  }

  async getMissionSnapshot(id: string, stuckAfterMs = DEFAULT_STUCK_AFTER_MS): Promise<MissionSnapshot> {
    const mission = await this.deps.missions.get(id);
    if (!mission) throw new Error("Mission not found");

    const tasks = await this.deps.tasks.listByMission(id);
    return this.buildSnapshot(mission, tasks, stuckAfterMs);
  }

  async reconcileMission(id: string, stuckAfterMs = DEFAULT_STUCK_AFTER_MS): Promise<MissionSnapshot> {
    const current = await this.getMissionSnapshot(id, stuckAfterMs);
    const nextStatus = this.deriveMissionStatus(current.mission.status, current.tasks, current.stuck);
    const metadata = {
      ...current.mission.metadata,
      progress: current.progress,
      taskCounts: current.counts,
      stuck: current.stuck,
      stuckTaskIds: current.stuckTaskIds,
      lastActivityAt: current.lastActivityAt,
    };

    const mission = await this.deps.missions.update(id, {
      status: nextStatus,
      metadata,
      updatedAt: new Date().toISOString(),
    });

    return { ...current, mission };
  }

  private buildSnapshot(mission: MissionRecord, tasks: TaskRecord[], stuckAfterMs: number): MissionSnapshot {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const working = tasks.filter((task) => task.status === "working" || task.status === "assigned").length;
    const blocked = tasks.filter((task) => task.status === "blocked").length;
    const waitingApproval = tasks.filter((task) => task.status === "waiting_approval").length;
    const failed = tasks.filter((task) => task.status === "failed").length;
    const terminal = tasks.filter((task) => ["completed", "cancelled", "failed"].includes(task.status)).length;
    const lastActivityAt = tasks.reduce(
      (latest, task) => (Date.parse(task.updatedAt) > Date.parse(latest) ? task.updatedAt : latest),
      mission.updatedAt,
    );
    const now = Date.now();
    const stuckTaskIds = tasks
      .filter((task) => ["assigned", "working", "blocked", "waiting_approval"].includes(task.status))
      .filter((task) => now - Date.parse(task.updatedAt) >= stuckAfterMs)
      .map((task) => task.id);

    return {
      mission,
      tasks,
      progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      counts: {
        total: tasks.length,
        completed,
        working,
        blocked,
        waitingApproval,
        failed,
        remaining: tasks.length - terminal,
      },
      stuck: stuckTaskIds.length > 0,
      stuckTaskIds,
      lastActivityAt,
    };
  }

  private deriveMissionStatus(current: MissionStatus, tasks: TaskRecord[], stuck: boolean): MissionStatus {
    if (["cancelled", "failed"].includes(current)) return current;
    if (tasks.length === 0) return current === "draft" ? "draft" : "planned";
    if (tasks.every((task) => ["completed", "cancelled"].includes(task.status))) return "completed";
    if (tasks.some((task) => task.status === "waiting_approval")) return "waiting_approval";
    if (tasks.every((task) => ["blocked", "failed", "completed", "cancelled"].includes(task.status))) {
      return tasks.some((task) => task.status === "failed") ? "failed" : "blocked";
    }
    if (stuck) return "blocked";
    return "active";
  }

  private async assertTaskCanEnterStatus(
    task: TaskRecord,
    nextStatus: TaskStatus,
    newApprovalRequestId?: string,
  ) {
    if (["assigned", "working", "completed"].includes(nextStatus)) {
      const dependencies = await Promise.all(task.dependencyIds.map((dependencyId) => this.deps.tasks.get(dependencyId)));
      const unresolved = dependencies.filter((dependency) => !dependency || dependency.status !== "completed");
      if (unresolved.length > 0) throw new Error("Task is blocked by unresolved dependencies.");
    }

    if (nextStatus === "completed" && task.requiresApproval && !(newApprovalRequestId ?? task.approvalRequestId)) {
      throw new Error("Sensitive tasks require an approved approval request.");
    }
  }

  private async assertDependenciesExist(missionId: string, dependencyIds: string[], currentTaskId?: string) {
    for (const dependencyId of new Set(dependencyIds)) {
      if (dependencyId === currentTaskId) throw new Error("A task cannot depend on itself.");
      const dependency = await this.deps.tasks.get(dependencyId);
      if (!dependency || dependency.missionId !== missionId) {
        throw new Error("Task dependency must exist in the same mission.");
      }
    }
  }

  private assertExecutive(executive: string) {
    if (!(EXECUTIVES as readonly string[]).includes(executive)) {
      throw new Error("Invalid executive assignment.");
    }
  }

  private assertValidExecutiveList(executives: string[]) {
    for (const executive of executives) this.assertExecutive(executive);
  }

  private assertMissionStatus(status: MissionStatus) {
    if (!MISSION_STATUSES.includes(status)) throw new Error("Invalid mission status.");
  }

  private assertTaskStatus(status: TaskStatus) {
    if (!TASK_STATUSES.includes(status)) throw new Error("Invalid task status.");
  }

  private assertText(value: string, field: string) {
    if (!value.trim()) throw new Error(`${field} is required.`);
  }
}
