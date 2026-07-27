import type {
  MissionRecord,
  MissionRepository,
  TaskRecord,
  TaskRepository,
} from "./types";
import { createSupabaseClient, type SupabaseClientLike } from "./supabase";

function mapMission(row: Record<string, unknown>): MissionRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ""),
    projectId: String(row.project_id),
    createdBy: String(row.created_by),
    assignedExecutives: Array.isArray(row.assigned_executives) ? row.assigned_executives.map(String) : [],
    status: row.status as MissionRecord["status"],
    priority: row.priority as MissionRecord["priority"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    dueAt: row.due_at ? String(row.due_at) : undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

function mapTask(row: Record<string, unknown>): TaskRecord {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    assignedExecutive: String(row.assigned_executive),
    status: row.status as TaskRecord["status"],
    priority: row.priority as TaskRecord["priority"],
    dependencyIds: Array.isArray(row.dependency_ids) ? row.dependency_ids.map(String) : [],
    requiresApproval: Boolean(row.requires_approval),
    approvalRequestId: row.approval_request_id ? String(row.approval_request_id) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    dueAt: row.due_at ? String(row.due_at) : undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

function missionRow(record: Partial<MissionRecord>) {
  return {
    ...(record.id !== undefined && { id: record.id }),
    ...(record.title !== undefined && { title: record.title }),
    ...(record.description !== undefined && { description: record.description }),
    ...(record.projectId !== undefined && { project_id: record.projectId }),
    ...(record.createdBy !== undefined && { created_by: record.createdBy }),
    ...(record.assignedExecutives !== undefined && { assigned_executives: record.assignedExecutives }),
    ...(record.status !== undefined && { status: record.status }),
    ...(record.priority !== undefined && { priority: record.priority }),
    ...(record.createdAt !== undefined && { created_at: record.createdAt }),
    ...(record.updatedAt !== undefined && { updated_at: record.updatedAt }),
    ...(record.dueAt !== undefined && { due_at: record.dueAt }),
    ...(record.metadata !== undefined && { metadata: record.metadata }),
  };
}

function taskRow(record: Partial<TaskRecord>) {
  return {
    ...(record.id !== undefined && { id: record.id }),
    ...(record.missionId !== undefined && { mission_id: record.missionId }),
    ...(record.title !== undefined && { title: record.title }),
    ...(record.description !== undefined && { description: record.description }),
    ...(record.assignedExecutive !== undefined && { assigned_executive: record.assignedExecutive }),
    ...(record.status !== undefined && { status: record.status }),
    ...(record.priority !== undefined && { priority: record.priority }),
    ...(record.dependencyIds !== undefined && { dependency_ids: record.dependencyIds }),
    ...(record.requiresApproval !== undefined && { requires_approval: record.requiresApproval }),
    ...(record.approvalRequestId !== undefined && { approval_request_id: record.approvalRequestId }),
    ...(record.createdAt !== undefined && { created_at: record.createdAt }),
    ...(record.updatedAt !== undefined && { updated_at: record.updatedAt }),
    ...(record.dueAt !== undefined && { due_at: record.dueAt }),
    ...(record.metadata !== undefined && { metadata: record.metadata }),
  };
}

abstract class SupabaseRepositoryBase {
  protected readonly client: SupabaseClientLike;

  constructor(client?: SupabaseClientLike) {
    this.client = client ?? createSupabaseClient({
      url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }

  protected unwrap<T>(result: { data: T | null; error: unknown }, fallback: string): T {
    if (result.error) throw new Error(`${fallback}: ${String(result.error)}`);
    if (result.data === null) throw new Error(fallback);
    return result.data;
  }
}

export class SupabaseMissionRepository extends SupabaseRepositoryBase implements MissionRepository {
  async create(record: MissionRecord): Promise<MissionRecord> {
    const result = await this.client.from("forge_missions").insert(missionRow(record)).select().single();
    return mapMission(this.unwrap(result, "Unable to create mission") as Record<string, unknown>);
  }

  async get(id: string): Promise<MissionRecord | null> {
    const result = await this.client.from("forge_missions").select("*").eq("id", id).maybeSingle();
    if (result.error) throw new Error(`Unable to load mission: ${String(result.error)}`);
    return result.data ? mapMission(result.data as Record<string, unknown>) : null;
  }

  async list(): Promise<MissionRecord[]> {
    const result = await this.client.from("forge_missions").select("*");
    const rows = this.unwrap(result, "Unable to list missions") as Record<string, unknown>[];
    return rows.map(mapMission).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async update(id: string, update: Partial<MissionRecord>): Promise<MissionRecord> {
    const result = await this.client.from("forge_missions").update(missionRow(update)).eq("id", id).select().single();
    return mapMission(this.unwrap(result, "Unable to update mission") as Record<string, unknown>);
  }
}

export class SupabaseTaskRepository extends SupabaseRepositoryBase implements TaskRepository {
  async create(record: TaskRecord): Promise<TaskRecord> {
    const result = await this.client.from("forge_tasks").insert(taskRow(record)).select().single();
    return mapTask(this.unwrap(result, "Unable to create task") as Record<string, unknown>);
  }

  async get(id: string): Promise<TaskRecord | null> {
    const result = await this.client.from("forge_tasks").select("*").eq("id", id).maybeSingle();
    if (result.error) throw new Error(`Unable to load task: ${String(result.error)}`);
    return result.data ? mapTask(result.data as Record<string, unknown>) : null;
  }

  async listByMission(missionId: string): Promise<TaskRecord[]> {
    const result = await this.client.from("forge_tasks").select("*").eq("mission_id", missionId);
    const rows = this.unwrap(result, "Unable to list tasks") as Record<string, unknown>[];
    return rows.map(mapTask).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async update(id: string, update: Partial<TaskRecord>): Promise<TaskRecord> {
    const result = await this.client.from("forge_tasks").update(taskRow(update)).eq("id", id).select().single();
    return mapTask(this.unwrap(result, "Unable to update task") as Record<string, unknown>);
  }
}
