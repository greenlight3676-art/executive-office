import { randomUUID } from "crypto";
import {
  ApprovalEventRecord,
  ApprovalEventRepository,
  ApprovalRecord,
  ApprovalRepository,
  ConversationRecord,
  ConversationRepository,
  MemoryRecord,
  MemoryRepository,
  MessageRecord,
  MessageRepository,
  MissionRecord,
  MissionRepository,
  TaskRecord,
  TaskRepository,
} from "./types";

export class InMemoryApprovalRepository implements ApprovalRepository {
  private readonly records = new Map<string, ApprovalRecord>();

  async create(record: ApprovalRecord) {
    this.records.set(record.id, record);
    return record;
  }

  async get(id: string) {
    return this.records.get(id) ?? null;
  }

  async list(filters?: { executiveId?: string; status?: string; projectId?: string; riskLevel?: string }) {
    return Array.from(this.records.values()).filter((record) => {
      const matchesExecutive = !filters?.executiveId || record.executiveId === filters.executiveId;
      const matchesStatus = !filters?.status || record.status === filters.status;
      const matchesProject = !filters?.projectId || record.projectId === filters.projectId;
      const matchesRisk = !filters?.riskLevel || record.riskLevel === filters.riskLevel;
      return matchesExecutive && matchesStatus && matchesProject && matchesRisk;
    });
  }

  async update(id: string, update: Partial<ApprovalRecord>) {
    const existing = this.records.get(id);
    if (!existing) throw new Error("Approval not found");
    const next = { ...existing, ...update };
    this.records.set(id, next);
    return next;
  }
}

export class InMemoryApprovalEventRepository implements ApprovalEventRepository {
  private readonly records = new Map<string, ApprovalEventRecord[]>();

  async create(record: ApprovalEventRecord) {
    const list = this.records.get(record.approvalRequestId) ?? [];
    list.push(record);
    this.records.set(record.approvalRequestId, list);
    return record;
  }

  async listByApprovalRequest(approvalRequestId: string) {
    return this.records.get(approvalRequestId) ?? [];
  }
}

export class InMemoryMissionRepository implements MissionRepository {
  private readonly records = new Map<string, MissionRecord>();

  async create(record: MissionRecord) {
    this.records.set(record.id, record);
    return record;
  }

  async get(id: string) {
    return this.records.get(id) ?? null;
  }

  async list() {
    return Array.from(this.records.values());
  }

  async update(id: string, update: Partial<MissionRecord>) {
    const existing = this.records.get(id);
    if (!existing) throw new Error("Mission not found");
    const next = { ...existing, ...update, updatedAt: new Date().toISOString() };
    this.records.set(id, next);
    return next;
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  private readonly records = new Map<string, TaskRecord>();

  async create(record: TaskRecord) {
    this.records.set(record.id, record);
    return record;
  }

  async get(id: string) {
    return this.records.get(id) ?? null;
  }

  async listByMission(missionId: string) {
    return Array.from(this.records.values()).filter((item) => item.missionId === missionId);
  }

  async update(id: string, update: Partial<TaskRecord>) {
    const existing = this.records.get(id);
    if (!existing) throw new Error("Task not found");
    const next = { ...existing, ...update, updatedAt: new Date().toISOString() };
    this.records.set(id, next);
    return next;
  }
}

export class InMemoryConversationRepository implements ConversationRepository {
  private readonly records = new Map<string, ConversationRecord>();

  async create(record: ConversationRecord) {
    this.records.set(record.id, record);
    return record;
  }

  async get(id: string) {
    return this.records.get(id) ?? null;
  }

  async list() {
    return Array.from(this.records.values());
  }
}

export class InMemoryMessageRepository implements MessageRepository {
  private readonly records = new Map<string, MessageRecord>();

  async create(record: MessageRecord) {
    this.records.set(record.id, record);
    return record;
  }

  async listByConversation(conversationId: string) {
    return Array.from(this.records.values()).filter((item) => item.conversationId === conversationId);
  }
}

export class InMemoryMemoryRepository implements MemoryRepository {
  private readonly records = new Map<string, MemoryRecord>();

  async create(record: MemoryRecord) {
    this.records.set(record.id, record);
    return record;
  }

  async listByExecutive(executiveId: string) {
    return Array.from(this.records.values()).filter((item) => item.executiveId === executiveId);
  }
}

export function createTestMission(): MissionRecord {
  return {
    id: randomUUID(),
    title: "Test mission",
    description: "Test",
    projectId: "proj-test",
    createdBy: "orynth",
    assignedExecutives: ["orynth"],
    status: "planned",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createTestTask(missionId: string): TaskRecord {
  return {
    id: randomUUID(),
    missionId,
    title: "Test task",
    description: "Test",
    assignedExecutive: "orynth",
    status: "todo",
    priority: "medium",
    dependencyIds: [],
    requiresApproval: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
