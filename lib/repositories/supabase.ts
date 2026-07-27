import { createClient } from "@supabase/supabase-js";

export interface SupabaseRepositoryConfig {
  url?: string;
  serviceRoleKey?: string;
}

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: unknown;
}

export interface SupabaseFilterQuery<T> extends PromiseLike<SupabaseQueryResult<T>> {
  eq: (column: string, value: string) => SupabaseFilterQuery<T>;
  single: () => Promise<SupabaseQueryResult<unknown>>;
  maybeSingle: () => Promise<SupabaseQueryResult<unknown>>;
}

export interface SupabaseClientLike {
  from: (table: string) => {
    insert: (record: unknown) => {
      select: () => SupabaseFilterQuery<unknown>;
    };
    select: (columns?: string) => SupabaseFilterQuery<unknown>;
    update: (record: unknown) => {
      eq: (column: string, value: string) => {
        select: () => SupabaseFilterQuery<unknown>;
      };
    };
  };
}

export function createSupabaseClient(config: SupabaseRepositoryConfig): SupabaseClientLike {
  const url = config.url;
  const serviceRoleKey = config.serviceRoleKey;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL and service role key are required.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as unknown as SupabaseClientLike;
}

export function isSupabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
