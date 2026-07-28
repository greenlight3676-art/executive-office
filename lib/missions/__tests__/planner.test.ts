import { createMissionTaskPlan, detectMissionIntent, inferExecutives } from "../planner";

describe("mission planner", () => {
  it("detects build requests as mission intents", () => {
    const intent = detectMissionIntent("Build a landing page for Owen and prep launch content");

    expect(intent).toMatchObject({
      title: "Build a landing page for Owen and prep launch content",
      priority: "medium",
    });
    expect(intent?.assignedExecutives).toEqual(expect.arrayContaining(["orynth", "brayko", "lunexa", "vyreel"]));
  });

  it("ignores casual non-work messages", () => {
    expect(detectMissionIntent("what is next")).toBeNull();
  });

  it("infers executive lanes from mission language", () => {
    expect(inferExecutives("Fix backend deploy and pricing")).toEqual(
      expect.arrayContaining(["orynth", "brayko", "kavro"]),
    );
  });

  it("creates task plans with approval flags for production work", () => {
    const intent = detectMissionIntent("Push phase 5 to main and deploy production")!;
    const tasks = createMissionTaskPlan(intent);

    expect(tasks.some((task) => task.assignedExecutive === "brayko" && task.requiresApproval)).toBe(true);
    expect(tasks[0].assignedExecutive).toBe("orynth");
  });
});