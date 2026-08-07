import { createSupabaseClient, SupabaseRepositoryConfig, SupabaseClientLike } from "./supabase";
import {
  ConversationRecord,
  MemoryRecord,
  MessageRecord,
  MissionRecord,
  TaskRecord,
} from "./types";

type Row = Record<string, unknown>;

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

function mapConversation(row: Row): ConversationRecord {
  return {
    id: String(row.id),
    executiveId: String(row.executive_id),
    title: row.title ? String(row.title) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function conversationRow(record: ConversationRecord): Row {
  return {
    id: record.id,
    executive_id: record.executiveId,
    title: record.title ?? "New conversation",
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function mapMessage(row: Row): MessageRecord {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    role: row.role as MessageRecord["role"],
    content: String(row.content),
    createdAt: String(row.created_at),
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

function messageRow(record: MessageRecord): Row {
  return {
    id: record.id,
    conversation_id: record.conversationId,
    role: record.role,
    content: record.content,
    created_at: record.createdAt,
    metadata: record.metadata ?? {},
  };
}

function mapMemory(row: Row): MemoryRecord {
  return {
    id: String(row.id),
    executiveId: String(row.executive_id),
    scope: row.scope as MemoryRecord["scope"],
    content: String(row.content),
    kind: String(row.kind),
    createdAt: String(row.created_at),
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

function memoryRow(record: MemoryRecord): Row {
  return {
    id: record.id,
    executive_id: record.executiveId,
    scope: record.scope,
    content: record.content,
    kind: record.kind,
    created_at: record.createdAt,
    metadata: record.metadata ?? {},
  };
}

export class SupabaseMissionRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: MissionRecord) {
    const { data, error } = await this.client.from("forge_missions").insert(missionRow(record)).select().single();
    if (error) throw error;
    return mapMission(data as Row);
  }

  async get(id: string) {
    const { data, error } = await this.client.from("forge_missions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapMission(data as Row) : null;
  }

  async list() {
    const { data, error } = await this.client.from("forge_missions").select("*");
    if (error) throw error;
    return ((data as Row[] | null) ?? []).map(mapMission);
  }

  async update(id: string, update: Partial<MissionRecord>) {
    const { data, error } = await this.client.from("forge_missions").update(missionRow(update)).eq("id", id).select().single();
    if (error) throw error;
    return mapMission(data as Row);
  }
}

export class SupabaseTaskRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: TaskRecord) {
    const { data, error } = await this.client.from("forge_tasks").insert(taskRow(record)).select().single();
    if (error) throw error;
    return mapTask(data as Row);
  }

  async get(id: string) {
    const { data, error } = await this.client.from("forge_tasks").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapTask(data as Row) : null;
  }

  async listByMission(missionId: string) {
    const response = await this.client.from("forge_tasks").select("*").eq("mission_id", missionId);
    const data = (response as { data?: Row[] | null; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;
    return (data ?? []).map(mapTask);
  }

  async update(id: string, update: Partial<TaskRecord>) {
    const { data, error } = await this.client.from("forge_tasks").update(taskRow(update)).eq("id", id).select().single();
    if (error) throw error;
    return mapTask(data as Row);
  }
}

export class SupabaseConversationRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: ConversationRecord) {
    const { data, error } = await this.client.from("forge_conversations").insert(conversationRow(record)).select().single();
    if (error) throw error;
    return mapConversation(data as Row);
  }

  async get(id: string) {
    const { data, error } = await this.client.from("forge_conversations").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapConversation(data as Row) : null;
  }

  async list() {
    const { data, error } = await this.client.from("forge_conversations").select("*");
    if (error) throw error;
    return ((data as Row[] | null) ?? []).map(mapConversation);
  }
}

export class SupabaseMessageRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: MessageRecord) {
    const { data, error } = await this.client.from("forge_messages").insert(messageRow(record)).select().single();
    if (error) throw error;
    return mapMessage(data as Row);
  }

  async listByConversation(conversationId: string) {
    const response = await this.client.from("forge_messages").select("*").eq("conversation_id", conversationId);
    const data = (response as { data?: Row[] | null; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;
    return (data ?? []).map(mapMessage);
  }
}

export class SupabaseMemoryRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: MemoryRecord) {
    const { data, error } = await this.client.from("forge_memories").insert(memoryRow(record)).select().single();
    if (error) throw error;
    return mapMemory(data as Row);
  }

  async listByExecutive(executiveId: string) {
    const response = await this.client.from("forge_memories").select("*").eq("executive_id", executiveId);
    const data = (response as { data?: Row[] | null; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;
    return (data ?? []).map(mapMemory);
  }
}

export function createSupabaseRepositories(config: SupabaseRepositoryConfig) {
  const client = createSupabaseClient(config);

  return {
    missions: new SupabaseMissionRepository(client),
    tasks: new SupabaseTaskRepository(client),
    conversations: new SupabaseConversationRepository(client),
    messages: new SupabaseMessageRepository(client),
    memories: new SupabaseMemoryRepository(client),
  };
}
