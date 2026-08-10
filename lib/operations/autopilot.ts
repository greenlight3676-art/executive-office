import { approvalService } from "@/lib/approvals/store";
import { forgeRuntime } from "@/lib/operations/runtime";
import type { TaskRecord } from "@/lib/repositories/types";

const TERMINAL = new Set(["completed", "cancelled", "failed"]);

export type AutopilotResult = {
  missionId: string;
  status: string;
  progress: number;
  advancedTaskIds: string[];
  approvalRequestIds: string[];
  stoppedForApproval: boolean;
  message: string;
};

export async function runMissionAutopilot(missionId: string): Promise<AutopilotResult> {
  let snapshot = await forgeRuntime.missionService.reconcileMission(missionId);
  const advancedTaskIds: string[] = [];
  const approvalRequestIds: string[] = [];

  // Advance deterministic mission state until we hit a human gate or terminal state.
  // Actual external side effects remain behind the approval/tool execution layer.
  for (let pass = 0; pass < 50; pass += 1) {
    if (TERMINAL.has(snapshot.mission.status)) break;

    const tasks = sortTasks(snapshot.tasks);
    const completedIds = new Set(tasks.filter((task) => task.status === "completed").map((task) => task.id));
    const runnable = tasks.filter((task) =>
      ["todo", "assigned", "blocked"].includes(task.status) &&
      task.dependencyIds.every((id) => completedIds.has(id)),
    );

    if (runnable.length === 0) break;
    const nextOrder = planOrder(runnable[0]);
    const stage = runnable.filter((task) => planOrder(task) === nextOrder);
    let changed = false;

    for (const task of stage) {
      if (task.requiresApproval) {
        if (task.approvalRequestId) continue;
        const approval = await approvalService.createApprovalRequest({
          executiveId: task.assignedExecutive,
          action: String(task.metadata?.action ?? "mission-sensitive-task"),
          reason: `Mission \"${snapshot.mission.title}\" needs approval for: ${task.title}`,
          riskLevel: task.priority === "high" ? "high" : "medium",
          projectId: snapshot.mission.projectId,
          payloadSummary: task.description || task.title,
        });
        await forgeRuntime.missionService.updateTask(task.id, {
          status: "waiting_approval",
          approvalRequestId: approval.id,
        });
        approvalRequestIds.push(approval.id);
        changed = true;
        continue;
      }

      // Safe internal planning/coordination steps advance without bothering TJ.
      await forgeRuntime.missionService.updateTask(task.id, { status: "working" });
      await forgeRuntime.missionService.updateTask(task.id, { status: "completed" });
      advancedTaskIds.push(task.id);
      changed = true;
    }

    snapshot = await forgeRuntime.missionService.reconcileMission(missionId);
    if (approvalRequestIds.length > 0 || !changed) break;
  }

  snapshot = await forgeRuntime.missionService.reconcileMission(missionId);
  const stoppedForApproval = snapshot.counts.waitingApproval > 0;
  return {
    missionId,
    status: snapshot.mission.status,
    progress: snapshot.progress,
    advancedTaskIds,
    approvalRequestIds,
    stoppedForApproval,
    message: stoppedForApproval
      ? `Autopilot advanced the mission to ${snapshot.progress}% and stopped for TJ approval.`
      : snapshot.mission.status === "completed"
        ? "Autopilot completed every safe mission step."
        : `Autopilot advanced the mission to ${snapshot.progress}%.`,
  };
}

function sortTasks(tasks: TaskRecord[]) {
  return [...tasks].sort((a, b) => planOrder(a) - planOrder(b) || a.createdAt.localeCompare(b.createdAt));
}

function planOrder(task: TaskRecord) {
  const value = Number(task.metadata?.planOrder ?? Number.MAX_SAFE_INTEGER);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}
