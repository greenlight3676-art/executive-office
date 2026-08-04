import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approvals/store";
import { requireApiSession } from "@/lib/auth/api";
import { forgeRuntime } from "@/lib/operations/runtime";
import type { TaskRecord } from "@/lib/repositories/types";

const { missionService } = forgeRuntime;
const CLOSED_MISSION_STATUSES = new Set(["completed", "cancelled", "failed"]);
const CLOSED_TASK_STATUSES = new Set(["completed", "cancelled", "failed"]);

function planOrder(task: TaskRecord) {
  const value = task.metadata?.planOrder;
  return typeof value === "number" ? value : Number.MAX_SAFE_INTEGER;
}

function taskIsRunnable(task: TaskRecord, tasks: TaskRecord[]) {
  const explicitDependenciesComplete = task.dependencyIds.every((id) =>
    tasks.some((candidate) => candidate.id === id && candidate.status === "completed"),
  );
  if (!explicitDependenciesComplete) return false;

  const order = planOrder(task);
  if (order === Number.MAX_SAFE_INTEGER) return true;

  return tasks
    .filter((candidate) => planOrder(candidate) < order)
    .every((candidate) => candidate.status === "completed");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const snapshot = await missionService.getMissionSnapshot(id);

    if (CLOSED_MISSION_STATUSES.has(snapshot.mission.status)) {
      return NextResponse.json({ success: true, advanced: [], snapshot, message: "Mission is already closed." });
    }

    const advanced: Array<{ taskId: string; from: string; to: string; approvalRequestId?: string }> = [];
    const tasks = [...snapshot.tasks].sort((a, b) => planOrder(a) - planOrder(b));

    for (const task of tasks) {
      if (CLOSED_TASK_STATUSES.has(task.status) || !taskIsRunnable(task, tasks)) continue;

      if (task.status === "waiting_approval" && task.approvalRequestId) {
        const approval = await approvalService.getApprovalRequest(task.approvalRequestId);
        if (approval?.status === "approved" || approval?.status === "executed") {
          await missionService.updateTask(task.id, { status: "working" });
          advanced.push({ taskId: task.id, from: task.status, to: "working", approvalRequestId: approval.id });
        } else if (approval && ["rejected", "cancelled", "expired", "failed"].includes(approval.status)) {
          await missionService.updateTask(task.id, { status: "failed" });
          advanced.push({ taskId: task.id, from: task.status, to: "failed", approvalRequestId: approval.id });
        }
        continue;
      }

      if ((task.status === "todo" || task.status === "blocked") && task.requiresApproval) {
        let approvalRequestId = task.approvalRequestId;
        if (!approvalRequestId) {
          const approval = await approvalService.createApprovalRequest({
            executiveId: task.assignedExecutive,
            action: "execute-mission-task",
            reason: `Mission task requires TJ approval: ${task.title}`,
            riskLevel: task.priority === "high" ? "high" : "medium",
            projectId: snapshot.mission.projectId,
            payloadSummary: task.description || task.title,
          });
          approvalRequestId = approval.id;
        }

        await missionService.updateTask(task.id, {
          status: "waiting_approval",
          approvalRequestId,
        });
        advanced.push({ taskId: task.id, from: task.status, to: "waiting_approval", approvalRequestId });
        continue;
      }

      if (task.status === "todo" || task.status === "assigned" || task.status === "blocked") {
        await missionService.updateTask(task.id, { status: "working" });
        advanced.push({ taskId: task.id, from: task.status, to: "working" });
      }
    }

    const nextSnapshot = await missionService.reconcileMission(id);
    return NextResponse.json({
      success: true,
      advanced,
      snapshot: nextSnapshot,
      message: advanced.length
        ? `Advanced ${advanced.length} task${advanced.length === 1 ? "" : "s"}.`
        : "No runnable tasks were found. Complete active work or review approvals.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to advance mission." },
      { status: 400 },
    );
  }
}
