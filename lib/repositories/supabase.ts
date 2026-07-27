export interface SupabaseRepositoryConfig {
  url?: string;
  serviceRoleKey?: string;
}

export function isSupabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
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
