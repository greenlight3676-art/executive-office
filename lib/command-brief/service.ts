import type { ApprovalRecord, MissionRecord, TaskRecord } from "@/lib/repositories/types";
import type { ForgeIntegration } from "@/lib/integrations/catalog";

type PersistenceMode = "supabase" | "memory";

export type CommandBriefInput = {
  missions: MissionRecord[];
  tasksByMission: Map<string, TaskRecord[]>;
  approvals: ApprovalRecord[];
  integrations: ForgeIntegration[];
  persistence: PersistenceMode;
};

export type CommandBrief = {
  generatedAt: string;
  headline: string;
  nextAction: string;
  riskLevel: "low" | "medium" | "high";
  counts: {
    missions: number;
    activeMissions: number;
    blockedMissions: number;
    openTasks: number;
    blockedTasks: number;
    pendingApprovals: number;
    connectedIntegrations: number;
    totalIntegrations: number;
  };
  focusMission: {
    id: string;
    title: string;
    status: MissionRecord["status"];
    priority: MissionRecord["priority"];
    progress: number;
    openTasks: number;
    blockedTasks: number;
  } | null;
  blockers: string[];
  readiness: Array<{
    label: string;
    status: "ready" | "needs_attention";
    detail: string;
  }>;
};

const closedMissionStatuses = new Set<MissionRecord["status"]>(["completed", "cancelled", "failed"]);
const closedTaskStatuses = new Set<TaskRecord["status"]>(["completed", "cancelled", "failed"]);
const priorityScore: Record<MissionRecord["priority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function missionProgress(tasks: TaskRecord[]) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((task) => task.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}

function getOpenTasks(tasksByMission: Map<string, TaskRecord[]>) {
  return Array.from(tasksByMission.values())
    .flat()
    .filter((task) => !closedTaskStatuses.has(task.status));
}

function getFocusMission(missions: MissionRecord[], tasksByMission: Map<string, TaskRecord[]>) {
  const openMissions = missions.filter((mission) => !closedMissionStatuses.has(mission.status));
  const [focus] = openMissions.sort((a, b) => {
    const statusScore =
      Number(b.status === "blocked" || b.status === "waiting_approval") -
      Number(a.status === "blocked" || a.status === "waiting_approval");
    if (statusScore !== 0) return statusScore;
    const priorityDelta = priorityScore[b.priority] - priorityScore[a.priority];
    if (priorityDelta !== 0) return priorityDelta;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  if (!focus) return null;

  const tasks = tasksByMission.get(focus.id) ?? [];
  const openTasks = tasks.filter((task) => !closedTaskStatuses.has(task.status)).length;
  const blockedTasks = tasks.filter((task) => task.status === "blocked" || task.status === "waiting_approval").length;

  return {
    id: focus.id,
    title: focus.title,
    status: focus.status,
    priority: focus.priority,
    progress: missionProgress(tasks),
    openTasks,
    blockedTasks,
  };
}

export function createCommandBrief(input: CommandBriefInput, generatedAt = new Date().toISOString()): CommandBrief {
  const openTasks = getOpenTasks(input.tasksByMission);
  const blockedTasks = openTasks.filter((task) => task.status === "blocked" || task.status === "waiting_approval");
  const pendingApprovals = input.approvals.filter((approval) => approval.status === "pending");
  const blockedMissions = input.missions.filter((mission) => mission.status === "blocked" || mission.status === "waiting_approval");
  const connectedIntegrations = input.integrations.filter((integration) => integration.status === "connected").length;
  const focusMission = getFocusMission(input.missions, input.tasksByMission);

  const blockers = [
    ...pendingApprovals.slice(0, 2).map((approval) => `Approval needed: ${approval.action}`),
    ...blockedTasks.slice(0, 2).map((task) => `Task blocked: ${task.title}`),
  ].slice(0, 3);

  const riskLevel =
    pendingApprovals.length || blockedTasks.length || input.persistence === "memory"
      ? input.persistence === "memory" || blockedTasks.length > 1 || pendingApprovals.length > 1
        ? "high"
        : "medium"
      : "low";

  const nextAction = pendingApprovals.length
    ? "Review the approval inbox before Forge executes anything external."
    : blockedTasks.length
      ? "Clear the blocked task before starting more work."
      : focusMission
        ? `Push ${focusMission.title} forward from the Mission Center.`
        : "Create the next mission and let the board break it into tasks.";

  const headline = pendingApprovals.length
    ? `${pendingApprovals.length} approval${pendingApprovals.length === 1 ? "" : "s"} waiting on TJ.`
    : blockedTasks.length
      ? `${blockedTasks.length} task${blockedTasks.length === 1 ? "" : "s"} blocked.`
      : focusMission
        ? `${focusMission.title} is the next move.`
        : "Forge is ready for a new mission.";

  return {
    generatedAt,
    headline,
    nextAction,
    riskLevel,
    counts: {
      missions: input.missions.length,
      activeMissions: input.missions.filter((mission) => mission.status === "active").length,
      blockedMissions: blockedMissions.length,
      openTasks: openTasks.length,
      blockedTasks: blockedTasks.length,
      pendingApprovals: pendingApprovals.length,
      connectedIntegrations,
      totalIntegrations: input.integrations.length,
    },
    focusMission,
    blockers,
    readiness: [
      {
        label: "Memory",
        status: input.persistence === "supabase" ? "ready" : "needs_attention",
        detail:
          input.persistence === "supabase"
            ? "Supabase persistence is active."
            : "Using temporary memory until Supabase keys are set.",
      },
      {
        label: "Tools",
        status: connectedIntegrations > 0 ? "ready" : "needs_attention",
        detail: `${connectedIntegrations}/${input.integrations.length} integrations connected.`,
      },
      {
        label: "Approvals",
        status: pendingApprovals.length === 0 ? "ready" : "needs_attention",
        detail:
          pendingApprovals.length === 0
            ? "No pending CEO approvals."
            : `${pendingApprovals.length} action${pendingApprovals.length === 1 ? "" : "s"} need a decision.`,
      },
    ],
  };
}
