import { MissionService } from "@/lib/operations/service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "@/lib/repositories/in-memory";
import { isSupabaseConfigured, requireSupabaseInProduction } from "@/lib/repositories/supabase";
import {
  SupabaseMissionRepository,
  SupabaseTaskRepository,
} from "@/lib/repositories/supabase-operations";
import type { MissionRepository, TaskRepository } from "@/lib/repositories/types";

type ForgeRuntime = {
  missionService: MissionService;
  missions: MissionRepository;
  tasks: TaskRepository;
  persistence: "supabase" | "memory";
};

const globalForForge = globalThis as typeof globalThis & {
  __forgeRuntime?: ForgeRuntime;
};

function createRuntime(): ForgeRuntime {
  requireSupabaseInProduction();
  const useSupabase = isSupabaseConfigured();
  const missions: MissionRepository = useSupabase
    ? new SupabaseMissionRepository()
    : new InMemoryMissionRepository();
  const tasks: TaskRepository = useSupabase
    ? new SupabaseTaskRepository()
    : new InMemoryTaskRepository();

  return {
    persistence: useSupabase ? "supabase" : "memory",
    missions,
    tasks,
    missionService: new MissionService({ missions, tasks }),
  };
}

export const forgeRuntime = globalForForge.__forgeRuntime ?? createRuntime();

if (process.env.NODE_ENV !== "production") {
  globalForForge.__forgeRuntime = forgeRuntime;
}
