import { MissionService } from "../service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "../../repositories/in-memory";

function createService() {
  return new MissionService({
    missions: new InMemoryMissionRepository(),
    tasks: new InMemoryTaskRepository(),
  });
}

async function createMission(service: MissionService, title = "Test mission") {
  return service.createMission({
    title,
    description: "Mission engine verification",
    projectId: "forge",
    createdBy: "orynth",
    assignedExecutives: ["orynth", "brayko"],
    priority: "high",
    status: "planned",
  });
}

describe("mission engine", () => {
  it("creates missions and tasks with validation", async () => {
    const service = createService();
    const mission = await createMission(service, "Launch boardroom");

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

  it("blocks a dependent task until its prerequisite is completed", async () => {
    const service = createService();
    const mission = await createMission(service, "Dependency mission");

    const first = await service.createTask(mission.id, {
      title: "First task",
      description: "Base task",
      assignedExecutive: "orynth",
      priority: "medium",
      dependencyIds: [],
    });
    const second = await service.createTask(mission.id, {
      title: "Second task",
      description: "Depends on first",
      assignedExecutive: "brayko",
      priority: "medium",
      dependencyIds: [first.id],
    });

    await expect(service.updateTask(second.id, { status: "working" })).rejects.toThrow(/blocked/i);
    await service.updateTask(first.id, { status: "completed" });
    const working = await service.updateTask(second.id, { status: "working" });

    expect(working.status).toBe("working");
  });

  it("requires an approval reference for sensitive task completion", async () => {
    const service = createService();
    const mission = await createMission(service, "Approval mission");
    const task = await service.createTask(mission.id, {
      title: "Deploy release",
      description: "Deploy to production",
      assignedExecutive: "brayko",
      priority: "high",
      requiresApproval: true,
      dependencyIds: [],
    });

    await expect(service.updateTask(task.id, { status: "completed" })).rejects.toThrow(/approval/i);
    const completed = await service.updateTask(task.id, {
      status: "completed",
      approvalRequestId: "approval-123",
    });

    expect(completed.status).toBe("completed");
  });

  it("creates an active mission with a deterministic executive task plan", async () => {
    const service = createService();
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
    expect(result.progress).toBe(0);
    expect(result.tasks.map((task) => task.assignedExecutive)).toEqual(
      expect.arrayContaining(["orynth", "brayko", "lunexa", "vyreel"]),
    );
  });

  it("reconciles mission progress and completes the mission automatically", async () => {
    const service = createService();
    const mission = await createMission(service, "Progress mission");
    const first = await service.createTask(mission.id, {
      title: "Plan",
      description: "Plan the work",
      assignedExecutive: "orynth",
      priority: "high",
    });
    const second = await service.createTask(mission.id, {
      title: "Build",
      description: "Build the work",
      assignedExecutive: "brayko",
      priority: "high",
    });

    await service.updateTask(first.id, { status: "completed" });
    const halfway = await service.getMissionSnapshot(mission.id);
    expect(halfway.progress).toBe(50);
    expect(halfway.mission.status).toBe("active");

    await service.updateTask(second.id, { status: "completed" });
    const finished = await service.getMissionSnapshot(mission.id);
    expect(finished.progress).toBe(100);
    expect(finished.mission.status).toBe("completed");
  });

  it("detects stale active work and marks the mission blocked", async () => {
    const missions = new InMemoryMissionRepository();
    const tasks = new InMemoryTaskRepository();
    const service = new MissionService({ missions, tasks });
    const mission = await createMission(service, "Stuck mission");
    const task = await service.createTask(mission.id, {
      title: "Long-running task",
      description: "This task stopped moving",
      assignedExecutive: "brayko",
      priority: "high",
    });

    await service.updateTask(task.id, { status: "working" });
    await tasks.update(task.id, { updatedAt: "2020-01-01T00:00:00.000Z" });

    const snapshot = await service.reconcileMission(mission.id, 1);
    expect(snapshot.stuck).toBe(true);
    expect(snapshot.stuckTaskIds).toContain(task.id);
    expect(snapshot.mission.status).toBe("blocked");
  });

  it("rejects missing and cross-mission dependencies", async () => {
    const service = createService();
    const firstMission = await createMission(service, "First mission");
    const secondMission = await createMission(service, "Second mission");
    const foreignTask = await service.createTask(secondMission.id, {
      title: "Foreign task",
      description: "Belongs somewhere else",
      assignedExecutive: "orynth",
      priority: "medium",
    });

    await expect(
      service.createTask(firstMission.id, {
        title: "Invalid dependency",
        description: "Should fail",
        assignedExecutive: "brayko",
        priority: "medium",
        dependencyIds: [foreignTask.id],
      }),
    ).rejects.toThrow(/same mission/i);
  });
});
