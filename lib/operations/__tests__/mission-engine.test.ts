import { MissionService } from "../service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "../../repositories/in-memory";

describe("mission engine", () => {
  it("creates missions and tasks with validation", async () => {
    const service = new MissionService({
      missions: new InMemoryMissionRepository(),
      tasks: new InMemoryTaskRepository(),
    });

    const mission = await service.createMission({
      title: "Launch boardroom",
      description: "Coordinate the executive review",
      projectId: "proj-1",
      createdBy: "orynth",
      assignedExecutives: ["orynth", "brayko"],
      priority: "high",
      status: "planned",
    });

    const task = await service.createTask(mission.id, {
      title: "Prepare release notes",
      description: "Draft the release summary",
      assignedExecutive: "brayko",
      priority: "medium",
      requiresApproval: false,
      dependencyIds: [],
    });

    expect(mission.status).toBe("planned");
    expect(task.status).toBe("todo");
    expect(task.missionId).toBe(mission.id);
  });

  it("blocks tasks with unmet dependencies", async () => {
    const service = new MissionService({
      missions: new InMemoryMissionRepository(),
      tasks: new InMemoryTaskRepository(),
    });

    const mission = await service.createMission({
      title: "Dependency mission",
      description: "Test dependencies",
      projectId: "proj-2",
      createdBy: "orynth",
      assignedExecutives: ["orynth"],
      priority: "medium",
      status: "planned",
    });

    const first = await service.createTask(mission.id, {
      title: "First task",
      description: "Base task",
      assignedExecutive: "orynth",
      priority: "medium",
      requiresApproval: false,
      dependencyIds: [],
    });

    const second = await service.createTask(mission.id, {
      title: "Second task",
      description: "Depends on first",
      assignedExecutive: "orynth",
      priority: "medium",
      requiresApproval: false,
      dependencyIds: [first.id],
    });

    await expect(service.updateTask(second.id, { status: "working" })).rejects.toThrow(/blocked/i);
  });

  it("requires approval for sensitive tasks", async () => {
    const service = new MissionService({
      missions: new InMemoryMissionRepository(),
      tasks: new InMemoryTaskRepository(),
    });

    const mission = await service.createMission({
      title: "Approval mission",
      description: "Sensitive work",
      projectId: "proj-3",
      createdBy: "orynth",
      assignedExecutives: ["orynth"],
      priority: "high",
      status: "planned",
    });

    const task = await service.createTask(mission.id, {
      title: "Deploy release",
      description: "Deploy to production",
      assignedExecutive: "brayko",
      priority: "high",
      requiresApproval: true,
      dependencyIds: [],
    });

    await expect(service.updateTask(task.id, { status: "completed" })).rejects.toThrow(/approval/i);
  });

  it("creates an active mission with a deterministic executive task plan", async () => {
    const service = new MissionService({
      missions: new InMemoryMissionRepository(),
      tasks: new InMemoryTaskRepository(),
    });

    const result = await service.createMissionWithPlan({
      title: "Build Forge command center",
      description: "Build a dashboard and launch flow",
      projectId: "forge",
      createdBy: "orynth",
      assignedExecutives: ["orynth", "brayko", "lunexa", "vyreel"],
      priority: "high",
      status: "planned",
      intent: {
        title: "Build Forge command center",
        description: "Build a dashboard and launch flow",
        priority: "high",
        assignedExecutives: ["orynth", "brayko", "lunexa", "vyreel"],
      },
    });

    expect(result.mission.status).toBe("active");
    expect(result.tasks.length).toBeGreaterThanOrEqual(4);
    expect(result.tasks.map((task) => task.assignedExecutive)).toEqual(
      expect.arrayContaining(["orynth", "brayko", "lunexa", "vyreel"]),
    );
  });
});