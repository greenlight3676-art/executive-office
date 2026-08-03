import { createCommandBrief } from "@/lib/command-brief/service";
import type { ApprovalRecord, MissionRecord, TaskRecord } from "@/lib/repositories/types";
import type { ForgeIntegration } from "@/lib/integrations/catalog";

function mission(overrides: Partial<MissionRecord> = {}): MissionRecord {
  return {
    id: "mission-1",
    title: "Ship Forge V2",
    description: "Upgrade the command layer",
    projectId: "forge",
    createdBy: "tj",
    assignedExecutives: ["orynth"],
    status: "active",
    priority: "high",
    createdAt: "2026-08-03T00:00:00.000Z",
    updatedAt: "2026-08-03T01:00:00.000Z",
    ...overrides,
  };
}

function task(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: "task-1",
    missionId: "mission-1",
    title: "Wire dashboard brief",
    description: "Show next action",
    assignedExecutive: "orynth",
    status: "todo",
    priority: "high",
    dependencyIds: [],
    requiresApproval: false,
    createdAt: "2026-08-03T00:00:00.000Z",
    updatedAt: "2026-08-03T00:00:00.000Z",
    ...overrides,
  };
}

function approval(overrides: Partial<ApprovalRecord> = {}): ApprovalRecord {
  return {
    id: "approval-1",
    executiveId: "orynth",
    action: "send client email",
    reason: "Needs external message approval",
    riskLevel: "medium",
    status: "pending",
    createdAt: "2026-08-03T00:00:00.000Z",
    expiresAt: "2026-08-04T00:00:00.000Z",
    executionStatus: "blocked",
    ...overrides,
  };
}

const integrations: ForgeIntegration[] = [
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    status: "connected",
    description: "Reasoning",
    requiredEnv: ["OPENAI_API_KEY"],
    executives: ["orynth"],
    approvalRequiredFor: ["high-cost-run"],
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "platform",
    status: "not_configured",
    description: "Persistence",
    requiredEnv: ["SUPABASE_URL"],
    executives: ["orynth"],
    approvalRequiredFor: ["delete-data"],
  },
];

describe("createCommandBrief", () => {
  it("prioritizes pending approvals as the next action", () => {
    const brief = createCommandBrief(
      {
        missions: [mission()],
        tasksByMission: new Map([["mission-1", [task()]]]),
        approvals: [approval()],
        integrations,
        persistence: "supabase",
      },
      "2026-08-03T02:00:00.000Z",
    );

    expect(brief.headline).toBe("1 approval waiting on TJ.");
    expect(brief.nextAction).toContain("approval inbox");
    expect(brief.counts.pendingApprovals).toBe(1);
    expect(brief.focusMission?.progress).toBe(0);
  });

  it("raises risk when Forge is only using memory persistence", () => {
    const brief = createCommandBrief(
      {
        missions: [mission()],
        tasksByMission: new Map([["mission-1", [task({ status: "completed" })]]]),
        approvals: [],
        integrations,
        persistence: "memory",
      },
      "2026-08-03T02:00:00.000Z",
    );

    expect(brief.riskLevel).toBe("high");
    expect(brief.readiness[0]).toEqual({
      label: "Memory",
      status: "needs_attention",
      detail: "Using temporary memory until Supabase keys are set.",
    });
    expect(brief.focusMission?.progress).toBe(100);
  });
});
