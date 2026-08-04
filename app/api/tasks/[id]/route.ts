import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approvals/store";
import { requireApiSession } from "@/lib/auth/api";
import { forgeRuntime } from "@/lib/operations/runtime";

const { missionService, tasks } = forgeRuntime;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const payload = await request.json();
    const current = await tasks.get(id);
    if (!current) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    if (current.requiresApproval && ["working", "completed"].includes(payload?.status)) {
      const approvalRequestId = typeof payload?.approvalRequestId === "string"
        ? payload.approvalRequestId
        : current.approvalRequestId;
      if (!approvalRequestId) {
        return NextResponse.json({ error: "This task requires TJ approval before it can run." }, { status: 409 });
      }

      const approval = await approvalService.getApprovalRequest(approvalRequestId);
      if (!approval || !["approved", "executed"].includes(approval.status)) {
        return NextResponse.json({ error: "TJ has not approved this task yet." }, { status: 409 });
      }
      payload.approvalRequestId = approvalRequestId;
    }

    const task = await missionService.updateTask(id, payload);
    const snapshot = await missionService.getMissionSnapshot(task.missionId);
    return NextResponse.json({ success: true, task, snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update task." },
      { status: 400 },
    );
  }
}
