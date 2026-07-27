export interface SupabaseRepositoryConfig {
  url?: string;
  serviceRoleKey?: string;
}

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: unknown;
}

export interface SupabaseSingleQuery<T> {
  single: () => Promise<SupabaseQueryResult<T>>;
  maybeSingle: () => Promise<SupabaseQueryResult<T>>;
}

export interface SupabaseSelectQuery<T> extends Promise<SupabaseQueryResult<T>> {
  eq: (column: string, value: string) => SupabaseSingleQuery<T>;
  single: () => Promise<SupabaseQueryResult<T>>;
  maybeSingle: () => Promise<SupabaseQueryResult<T>>;
}

export interface SupabaseClientLike {
  from: (table: string) => {
    insert: (record: unknown) => {
      select: () => SupabaseSingleQuery<unknown>;
    };
    select: (columns?: string) => SupabaseSelectQuery<unknown>;
    update: (record: unknown) => {
      eq: (column: string, value: string) => {
        select: () => SupabaseSingleQuery<unknown>;
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

  try {
    return createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch {
    throw new Error("Supabase client dependency is not installed.");
  }
}

function createClient(url: string, key: string, options?: unknown): SupabaseClientLike {
  try {
    const clientModule = require("@supabase/supabase-js");
    return clientModule.createClient(url, key, options as never) as SupabaseClientLike;
  } catch {
    throw new Error("Supabase client dependency is not installed.");
  }
}
