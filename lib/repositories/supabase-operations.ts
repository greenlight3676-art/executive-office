import type { MissionRecord, MissionRepository, TaskRecord, TaskRepository } from "./types";
import { getSupabaseRepositoryConfig } from "./supabase";

type Row = Record<string, unknown>;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  query?: string;
  body?: Row;
};

async function supabaseRequest(table: string, options: RequestOptions = {}): Promise<Row[]> {
  const { url, serviceRoleKey } = getSupabaseRepositoryConfig();
  const response = await fetch(`${url}/rest/v1/${table}${options.query ? `?${options.query}` : ""}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: options.method === "POST" || options.method === "PATCH" ? "return=representation" : "",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} request failed (${response.status}): ${await response.text()}`);
  }

  return (await response.json()) as Row[];
}

function mapMission(row: Row): MissionRecord {
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

function mapTask(row: Row): TaskRecord {
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

function missionRow(record: Partial<MissionRecord>): Row {
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

function taskRow(record: Partial<TaskRecord>): Row {
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

export class SupabaseMissionRepository implements MissionRepository {
  async create(record: MissionRecord) {
    const [row] = await supabaseRequest("forge_missions", { method: "POST", body: missionRow(record) });
    if (!row) throw new Error("Unable to create mission.");
    return mapMission(row);
  }

  async get(id: string) {
    const [row] = await supabaseRequest("forge_missions", { query: `id=eq.${encodeURIComponent(id)}&limit=1` });
    return row ? mapMission(row) : null;
  }

  async list() {
    const rows = await supabaseRequest("forge_missions", { query: "select=*&order=updated_at.desc" });
    return rows.map(mapMission);
  }

  async update(id: string, update: Partial<MissionRecord>) {
    const [row] = await supabaseRequest("forge_missions", {
      method: "PATCH",
      query: `id=eq.${encodeURIComponent(id)}`,
      body: missionRow(update),
    });
    if (!row) throw new Error("Mission not found.");
    return mapMission(row);
  }
}

export class SupabaseTaskRepository implements TaskRepository {
  async create(record: TaskRecord) {
    const [row] = await supabaseRequest("forge_tasks", { method: "POST", body: taskRow(record) });
    if (!row) throw new Error("Unable to create task.");
    return mapTask(row);
  }

  async get(id: string) {
    const [row] = await supabaseRequest("forge_tasks", { query: `id=eq.${encodeURIComponent(id)}&limit=1` });
    return row ? mapTask(row) : null;
  }

  async listByMission(missionId: string) {
    const rows = await supabaseRequest("forge_tasks", {
      query: `mission_id=eq.${encodeURIComponent(missionId)}&order=created_at.asc`,
    });
    return rows.map(mapTask);
  }

  async update(id: string, update: Partial<TaskRecord>) {
    const [row] = await supabaseRequest("forge_tasks", {
      method: "PATCH",
      query: `id=eq.${encodeURIComponent(id)}`,
      body: taskRow(update),
    });
    if (!row) throw new Error("Task not found.");
    return mapTask(row);
  }
}
