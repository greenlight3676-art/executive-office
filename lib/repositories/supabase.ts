import { createClient } from "@supabase/supabase-js";

export interface SupabaseRepositoryConfig {
  url?: string;
  serviceRoleKey?: string;
}

export interface SupabaseQueryResult<T = unknown> {
  data: T | null;
  error: unknown;
}

export interface SupabaseSingleQuery<T = unknown> {
  single: () => Promise<SupabaseQueryResult<T>>;
  maybeSingle: () => Promise<SupabaseQueryResult<T>>;
}

export interface SupabaseSelectQuery<T = unknown>
  extends PromiseLike<SupabaseQueryResult<T>> {
  eq: (column: string, value: string) => SupabaseSelectQuery<T> & SupabaseSingleQuery<T>;
  single: () => Promise<SupabaseQueryResult<T>>;
  maybeSingle: () => Promise<SupabaseQueryResult<T>>;
}

export interface SupabaseClientLike {
  from: (table: string) => {
    insert: (record: unknown) => {
      select: (columns?: string) => SupabaseSingleQuery<unknown>;
    };
    select: (columns?: string) => SupabaseSelectQuery<unknown>;
    update: (record: unknown) => {
      eq: (column: string, value: string) => {
        select: (columns?: string) => SupabaseSingleQuery<unknown>;
      };
    };
  };
}

export function createSupabaseClient(config: SupabaseRepositoryConfig): SupabaseClientLike {
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase URL and service role key are required.");
  }

  return createClient(config.url.replace(/\/$/, ""), config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as SupabaseClientLike;
}

export function isSupabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function requireSupabaseInProduction(
  environment = process.env.NODE_ENV ?? "development",
  env: NodeJS.ProcessEnv = process.env,
) {
  if (environment === "production" && !isSupabaseConfigured(env)) {
    throw new Error(
      "Forge production requires Supabase persistent storage. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
}

export function getSupabaseRepositoryConfig(
  env: NodeJS.ProcessEnv = process.env,
): Required<SupabaseRepositoryConfig> {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL and service role key are required.");
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
  };
}
