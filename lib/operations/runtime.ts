import { MissionService } from "@/lib/operations/service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "@/lib/repositories/in-memory";
import { isSupabaseConfigured } from "@/lib/repositories/supabase";
import {
  SupabaseMissionRepository,
  SupabaseTaskRepository,
} from "@/lib/repositories/supabase-operations";

type ForgeRuntime = {
  missionService: MissionService;
  persistence: "supabase" | "memory";
};

const globalForForge = globalThis as typeof globalThis & {
  __forgeRuntime?: ForgeRuntime;
};

function createRuntime(): ForgeRuntime {
  const useSupabase = isSupabaseConfigured();

  return {
    persistence: useSupabase ? "supabase" : "memory",
    missionService: new MissionService({
      missions: useSupabase
        ? new SupabaseMissionRepository()
        : new InMemoryMissionRepository(),
      tasks: useSupabase
        ? new SupabaseTaskRepository()
        : new InMemoryTaskRepository(),
    }),
  };
}

export const forgeRuntime = globalForForge.__forgeRuntime ?? createRuntime();

if (process.env.NODE_ENV !== "production") {
  globalForForge.__forgeRuntime = forgeRuntime;
}
