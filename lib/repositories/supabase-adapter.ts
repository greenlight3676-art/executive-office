import { createSupabaseClient, SupabaseRepositoryConfig, SupabaseClientLike } from "./supabase";
import { ConversationRecord, MemoryRecord, MessageRecord, MissionRecord, TaskRecord } from "./types";

export class SupabaseMissionRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: MissionRecord) {
    const { data, error } = await this.client.from("missions").insert(record).select().single();
    if (error) throw error;
    return data as MissionRecord;
  }

  async get(id: string) {
    const { data, error } = await this.client.from("missions").select("*").eq("id", id).single();
    if (error) throw error;
    return data as MissionRecord;
  }

  async list() {
    const { data, error } = await this.client.from("missions").select("*");
    if (error) throw error;
    return data as MissionRecord[];
  }

  async update(id: string, update: Partial<MissionRecord>) {
    const { data, error } = await this.client.from("missions").update(update).eq("id", id).select().single();
    if (error) throw error;
    return data as MissionRecord;
  }
}

export class SupabaseTaskRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: TaskRecord) {
    const { data, error } = await this.client.from("tasks").insert(record).select().single();
    if (error) throw error;
    return data as TaskRecord;
  }

  async get(id: string) {
    const { data, error } = await this.client.from("tasks").select("*").eq("id", id).single();
    if (error) throw error;
    return data as TaskRecord;
  }

  async listByMission(missionId: string) {
    const response = await this.client.from("tasks").select("*").eq("mission_id", missionId);
    const data = (response as { data?: TaskRecord[]; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;
    return data ?? [];
  }

  async update(id: string, update: Partial<TaskRecord>) {
    const { data, error } = await this.client.from("tasks").update(update).eq("id", id).select().single();
    if (error) throw error;
    return data as TaskRecord;
  }
}

export class SupabaseConversationRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: ConversationRecord) {
    const { data, error } = await this.client.from("conversations").insert(record).select().single();
    if (error) throw error;
    return data as ConversationRecord;
  }

  async get(id: string) {
    const { data, error } = await this.client.from("conversations").select("*").eq("id", id).single();
    if (error) throw error;
    return data as ConversationRecord;
  }

  async list() {
    const { data, error } = await this.client.from("conversations").select("*");
    if (error) throw error;
    return data as ConversationRecord[];
  }
}

export class SupabaseMessageRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: MessageRecord) {
    const { data, error } = await this.client.from("messages").insert(record).select().single();
    if (error) throw error;
    return data as MessageRecord;
  }

  async listByConversation(conversationId: string) {
    const response = await this.client.from("messages").select("*").eq("conversation_id", conversationId);
    const data = (response as { data?: MessageRecord[]; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;
    return data ?? [];
  }
}

export class SupabaseMemoryRepository {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(record: MemoryRecord) {
    const { data, error } = await this.client.from("memories").insert(record).select().single();
    if (error) throw error;
    return data as MemoryRecord;
  }

  async listByExecutive(executiveId: string) {
    const response = await this.client.from("memories").select("*").eq("executive_id", executiveId);
    const data = (response as { data?: MemoryRecord[]; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;
    return data ?? [];
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
