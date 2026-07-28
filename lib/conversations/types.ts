import type { ExecutiveId } from "@/lib/agents/types";

export type Conversation = {
  id: string;
  executiveId: ExecutiveId;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type ExecutiveMemory = {
  id: string;
  executiveId: ExecutiveId;
  scope: "short-term" | "long-term" | "project";
  content: string;
  kind: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export interface ConversationStore {
  readonly persistence: "supabase" | "memory";
  createConversation(input: Pick<Conversation, "executiveId" | "title">): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  listConversations(executiveId?: ExecutiveId): Promise<Conversation[]>;
  createMessage(
    input: Pick<ConversationMessage, "conversationId" | "role" | "content"> & {
      metadata?: Record<string, unknown>;
    },
  ): Promise<ConversationMessage>;
  listMessages(conversationId: string, limit?: number): Promise<ConversationMessage[]>;
  createMemory(
    input: Pick<ExecutiveMemory, "executiveId" | "scope" | "content" | "kind"> & {
      metadata?: Record<string, unknown>;
    },
  ): Promise<ExecutiveMemory>;
  listMemories(executiveId: ExecutiveId, limit?: number): Promise<ExecutiveMemory[]>;
}
