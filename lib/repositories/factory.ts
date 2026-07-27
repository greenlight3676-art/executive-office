import { createApprovalStore } from "@/lib/approvals/store";
import { InMemoryApprovalStore } from "@/lib/approvals/in-memory-store";
import { InMemoryConversationRepository, InMemoryMemoryRepository, InMemoryMessageRepository, InMemoryMissionRepository, InMemoryTaskRepository } from "./in-memory";
import { createSupabaseRepositories } from "./supabase-adapter";
import { createSupabaseClient } from "./supabase";

export interface PersistenceFactoryOptions {
  allowMemory?: boolean;
  environment?: string;
}

export function createPersistenceRepositories(options: PersistenceFactoryOptions = {}) {
  const allowMemory = options.allowMemory ?? process.env.NODE_ENV === "test";
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (environment !== "test" && !allowMemory) {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
  }

  if (environment === "test" || allowMemory) {
    return {
      approvals: new InMemoryApprovalStore(),
      approvalEvents: undefined,
      missions: new InMemoryMissionRepository(),
      tasks: new InMemoryTaskRepository(),
      conversations: new InMemoryConversationRepository(),
      messages: new InMemoryMessageRepository(),
      memories: new InMemoryMemoryRepository(),
    } as const;
  }

  const client = createSupabaseClient({ url: supabaseUrl, serviceRoleKey });
  void client;
  return createSupabaseRepositories({ url: supabaseUrl, serviceRoleKey });
}

export function createApprovalStore(options: PersistenceFactoryOptions = {}) {
  const allowMemory = options.allowMemory ?? process.env.NODE_ENV === "test";
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (environment !== "test" && !allowMemory) {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
  }

  if (environment === "test" || allowMemory) {
    return new InMemoryApprovalStore();
  }

  return new InMemoryApprovalStore();
}
