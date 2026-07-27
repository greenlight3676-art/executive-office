import { MissionService } from "@/lib/operations/service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "@/lib/repositories/in-memory";

type ForgeRuntime = {
  missionService: MissionService;
};

const globalForForge = globalThis as typeof globalThis & {
  __forgeRuntime?: ForgeRuntime;
};

export const forgeRuntime =
  globalForForge.__forgeRuntime ??
  {
    missionService: new MissionService({
      missions: new InMemoryMissionRepository(),
      tasks: new InMemoryTaskRepository(),
    }),
  };

if (process.env.NODE_ENV !== "production") {
  globalForForge.__forgeRuntime = forgeRuntime;
}
