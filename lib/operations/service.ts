import { randomUUID } from "crypto";
import { MissionRepository, TaskRepository } from "@/lib/repositories/types";

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
  status?: string;
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

export class MissionService {
  constructor(private readonly deps: MissionServiceDependencies) {}

  async createMission(input: CreateMissionInput) {
    this.assertValidExecutiveList(input.assignedExecutives);

    const mission = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      createdBy: input.createdBy,
      assignedExecutives: input.assignedExecutives,
      status: (input.status ?? "planned") as "draft" | "planned" | "active" | "blocked" | "waiting_approval" | "completed" | "cancelled" | "failed",
      priority: input.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: input.dueAt,
      metadata: input.metadata,
    };

    return this.deps.missions.create(mission);
  }

  async getMission(id: string) {
    return this.deps.missions.get(id);
  }

  async listMissions() {
    return this.deps.missions.list();
  }

  async updateMission(id: string, updates: Partial<CreateMissionInput> & { status?: string }) {
    if (updates.assignedExecutives) {
      this.assertValidExecutiveList(updates.assignedExecutives);
    }

    return this.deps.missions.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    } as never);
  }

  async createTask(missionId: string, input: CreateTaskInput) {
    const mission = await this.deps.missions.get(missionId);
    if (!mission) throw new Error("Mission not found");

    this.assertExecutive(input.assignedExecutive);
    const task = {
      id: randomUUID(),
      missionId,
      title: input.title,
      description: input.description,
      assignedExecutive: input.assignedExecutive,
      status: "todo" as const,
      priority: input.priority,
      dependencyIds: input.dependencyIds ?? [],
      requiresApproval: input.requiresApproval ?? false,
      approvalRequestId: input.approvalRequestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: input.dueAt,
      metadata: input.metadata,
    };

    return this.deps.tasks.create(task);
  }

  async listTasks(missionId: string) {
    return this.deps.tasks.listByMission(missionId);
  }

  async updateTask(id: string, updates: Partial<CreateTaskInput> & { status?: string }) {
    const task = await this.deps.tasks.get(id);
    if (!task) throw new Error("Task not found");

    if (updates.status && this.isBlockedTransition(task, updates.status)) {
      throw new Error("Task is blocked by unresolved dependencies.");
    }

    if (updates.status === "completed" && task.requiresApproval) {
      throw new Error("Sensitive tasks require an approved approval request.");
    }

    if (updates.assignedExecutive) {
      this.assertExecutive(updates.assignedExecutive);
    }

    return this.deps.tasks.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    } as never);
  }

  private isBlockedTransition(task: { dependencyIds: string[]; status: string }, nextStatus: string) {
    if (nextStatus !== "working" && nextStatus !== "assigned" && nextStatus !== "blocked" && nextStatus !== "waiting_approval") {
      return false;
    }

    const dependencies = task.dependencyIds ?? [];
    if (dependencies.length === 0) return false;

    return true;
  }

  private assertExecutive(executive: string) {
    if (!["orynth", "brayko", "lunexa", "vyreel", "kavro"].includes(executive)) {
      throw new Error("Invalid executive assignment.");
    }
  }

  private assertValidExecutiveList(executives: string[]) {
    for (const executive of executives) {
      this.assertExecutive(executive);
    }
  }
}
