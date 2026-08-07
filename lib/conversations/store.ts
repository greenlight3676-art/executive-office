import { randomUUID } from "crypto";
import type { ExecutiveId } from "@/lib/agents/types";
import {
  getSupabaseRepositoryConfig,
  isSupabaseConfigured,
  requireSupabaseInProduction,
} from "@/lib/repositories/supabase";
import type {
  Conversation,
  ConversationMessage,
  ConversationStore,
  ExecutiveMemory,
} from "./types";

type Row = Record<string, unknown>;
type WriteMethod = "POST" | "PATCH" | "DELETE";

function now() {
  return new Date().toISOString();
}

function mapConversation(row: Row): Conversation {
  return {
    id: String(row.id),
    executiveId: String(row.executive_id) as ExecutiveId,
    title: String(row.title ?? "New conversation"),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMessage(row: Row): ConversationMessage {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    role: row.role as ConversationMessage["role"],
    content: String(row.content),
    createdAt: String(row.created_at),
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

function mapMemory(row: Row): ExecutiveMemory {
  return {
    id: String(row.id),
    executiveId: String(row.executive_id) as ExecutiveId,
    scope: row.scope as ExecutiveMemory["scope"],
    content: String(row.content),
    kind: String(row.kind),
    createdAt: String(row.created_at),
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

class InMemoryConversationStore implements ConversationStore {
  readonly persistence = "memory" as const;
  private readonly conversations = new Map<string, Conversation>();
  private readonly messages = new Map<string, ConversationMessage>();
  private readonly memories = new Map<string, ExecutiveMemory>();

  async createConversation(input: Pick<Conversation, "executiveId" | "title">) {
    const timestamp = now();
    const conversation: Conversation = {
      id: randomUUID(),
      executiveId: input.executiveId,
      title: input.title,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async getConversation(id: string) {
    return this.conversations.get(id) ?? null;
  }

  async listConversations(executiveId?: ExecutiveId) {
    return [...this.conversations.values()]
      .filter((conversation) => !executiveId || conversation.executiveId === executiveId)
      .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createMessage(
    input: Pick<ConversationMessage, "conversationId" | "role" | "content"> & {
      metadata?: Record<string, unknown>;
    },
  ) {
    const conversation = this.conversations.get(input.conversationId);
    if (!conversation) throw new Error("Conversation not found.");

    const message: ConversationMessage = {
      id: randomUUID(),
      ...input,
      createdAt: now(),
    };
    this.messages.set(message.id, message);
    this.conversations.set(conversation.id, {
      ...conversation,
      updatedAt: message.createdAt,
    });
    return message;
  }

  async listMessages(conversationId: string, limit = 40) {
    return [...this.messages.values()]
      .filter((message) => message.conversationId === conversationId)
      .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-limit);
  }

  async createMemory(
    input: Pick<ExecutiveMemory, "executiveId" | "scope" | "content" | "kind"> & {
      metadata?: Record<string, unknown>;
    },
  ) {
    const memory: ExecutiveMemory = {
      id: randomUUID(),
      ...input,
      createdAt: now(),
    };
    this.memories.set(memory.id, memory);
    return memory;
  }

  async listMemories(executiveId: ExecutiveId, limit = 12) {
    return [...this.memories.values()]
      .filter((memory) => memory.executiveId === executiveId)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async deleteMemory(id: string) {
    return this.memories.delete(id);
  }
}

class SupabaseConversationStore implements ConversationStore {
  readonly persistence = "supabase" as const;

  private async request(
    table: "forge_conversations" | "forge_messages" | "forge_memories",
    options: { method?: WriteMethod; query?: string; body?: Row } = {},
  ): Promise<Row[]> {
    const { url, serviceRoleKey } = getSupabaseRepositoryConfig();
    const response = await fetch(
      `${url}/rest/v1/${table}${options.query ? `?${options.query}` : ""}`,
      {
        method: options.method ?? "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: options.method ? "return=representation" : "",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Conversation storage request failed (${response.status}).`);
    }

    return (await response.json()) as Row[];
  }

  async createConversation(input: Pick<Conversation, "executiveId" | "title">) {
    const timestamp = now();
    const [row] = await this.request("forge_conversations", {
      method: "POST",
      body: {
        id: randomUUID(),
        executive_id: input.executiveId,
        title: input.title,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });
    if (!row) throw new Error("Unable to create conversation.");
    return mapConversation(row);
  }

  async getConversation(id: string) {
    const [row] = await this.request("forge_conversations", {
      query: `id=eq.${encodeURIComponent(id)}&limit=1`,
    });
    return row ? mapConversation(row) : null;
  }

  async listConversations(executiveId?: ExecutiveId) {
    const filter = executiveId
      ? `executive_id=eq.${encodeURIComponent(executiveId)}&`
      : "";
    const rows = await this.request("forge_conversations", {
      query: `${filter}select=*&order=updated_at.desc`,
    });
    return rows.map(mapConversation);
  }

  async createMessage(
    input: Pick<ConversationMessage, "conversationId" | "role" | "content"> & {
      metadata?: Record<string, unknown>;
    },
  ) {
    const timestamp = now();
    const [row] = await this.request("forge_messages", {
      method: "POST",
      body: {
        id: randomUUID(),
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
        created_at: timestamp,
        metadata: input.metadata ?? {},
      },
    });
    if (!row) throw new Error("Unable to save message.");

    await this.request("forge_conversations", {
      method: "PATCH",
      query: `id=eq.${encodeURIComponent(input.conversationId)}`,
      body: { updated_at: timestamp },
    });

    return mapMessage(row);
  }

  async listMessages(conversationId: string, limit = 40) {
    const rows = await this.request("forge_messages", {
      query: `conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.desc&limit=${limit}`,
    });
    return rows.map(mapMessage).reverse();
  }

  async createMemory(
    input: Pick<ExecutiveMemory, "executiveId" | "scope" | "content" | "kind"> & {
      metadata?: Record<string, unknown>;
    },
  ) {
    const [row] = await this.request("forge_memories", {
      method: "POST",
      body: {
        id: randomUUID(),
        executive_id: input.executiveId,
        scope: input.scope,
        content: input.content,
        kind: input.kind,
        created_at: now(),
        metadata: input.metadata ?? {},
      },
    });
    if (!row) throw new Error("Unable to save executive memory.");
    return mapMemory(row);
  }

  async listMemories(executiveId: ExecutiveId, limit = 12) {
    const rows = await this.request("forge_memories", {
      query: `executive_id=eq.${encodeURIComponent(executiveId)}&select=*&order=created_at.desc&limit=${limit}`,
    });
    return rows.map(mapMemory);
  }

  async deleteMemory(id: string) {
    const rows = await this.request("forge_memories", {
      method: "DELETE",
      query: `id=eq.${encodeURIComponent(id)}&select=id`,
    });
    return rows.length > 0;
  }
}

type GlobalConversationRuntime = typeof globalThis & {
  __forgeConversationStore?: ConversationStore;
};

const globalForConversations = globalThis as GlobalConversationRuntime;

function createConversationStore(): ConversationStore {
  requireSupabaseInProduction();
  return isSupabaseConfigured()
    ? new SupabaseConversationStore()
    : new InMemoryConversationStore();
}

export const conversationStore =
  globalForConversations.__forgeConversationStore ?? createConversationStore();

if (process.env.NODE_ENV !== "production") {
  globalForConversations.__forgeConversationStore = conversationStore;
}

export { InMemoryConversationStore, SupabaseConversationStore };
