import { InMemoryApprovalStore } from "@/lib/approvals/in-memory-store";
import { SupabaseApprovalStore } from "@/lib/approvals/supabase-store";
import {
  InMemoryConversationRepository,
  InMemoryMemoryRepository,
  InMemoryMessageRepository,
  InMemoryMissionRepository,
  InMemoryTaskRepository,
} from "./in-memory";
import { createSupabaseRepositories } from "./supabase-adapter";
import {
  createSupabaseClient,
  requireSupabaseInProduction,
} from "./supabase";

export interface PersistenceFactoryOptions {
  allowMemory?: boolean;
  environment?: string;
}

function getSupabaseEnvironment() {
  return {
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function createPersistenceRepositories(options: PersistenceFactoryOptions = {}) {
  const allowMemory = options.allowMemory ?? process.env.NODE_ENV === "test";
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const { supabaseUrl, serviceRoleKey } = getSupabaseEnvironment();

  requireSupabaseInProduction(environment);

  if (environment !== "test" && !allowMemory && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
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

  return createSupabaseRepositories({ url: supabaseUrl, serviceRoleKey });
}

export function createApprovalStore(options: PersistenceFactoryOptions = {}) {
  const allowMemory = options.allowMemory ?? process.env.NODE_ENV === "test";
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const { supabaseUrl, serviceRoleKey } = getSupabaseEnvironment();

  requireSupabaseInProduction(environment);

  if (environment !== "test" && !allowMemory && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (environment === "test" || allowMemory) {
    return new InMemoryApprovalStore();
  }

  return new SupabaseApprovalStore(
    createSupabaseClient({ url: supabaseUrl, serviceRoleKey }),
  );
}

// This file intentionally exports createApprovalStore locally; do not import it from approvals/store.
