import { InMemoryApprovalStore } from "./in-memory-store";
import { ApprovalService } from "./service";
import { SupabaseApprovalStore } from "./supabase-store";
import {
  createSupabaseClient,
  isSupabaseConfigured,
  requireSupabaseInProduction,
} from "@/lib/repositories/supabase";

export interface ApprovalStoreFactoryOptions {
  allowMemory?: boolean;
  environment?: string;
}

export function createApprovalStore(options: ApprovalStoreFactoryOptions = {}) {
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const allowMemory = options.allowMemory ?? environment === "test";

  requireSupabaseInProduction(environment);

  if (allowMemory || !isSupabaseConfigured()) {
    return new InMemoryApprovalStore();
  }

  return new SupabaseApprovalStore(
    createSupabaseClient({
      url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }),
  );
}

export const approvalStore = createApprovalStore();
export const approvalService = new ApprovalService(approvalStore);
