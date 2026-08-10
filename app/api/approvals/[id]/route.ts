import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approvals/store";
import { requireApiSession } from "@/lib/auth/api";
import {
  createToolFailureResult,
  executeApprovedComposioAction,
} from "@/lib/tools/composio";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const { id } = await params;
  const requestData = await approvalService.getApprovalRequest(id);

  if (!requestData) {
    return NextResponse.json({ error: "Approval request not found." }, { status: 404 });
  }

  const events = await approvalService.listApprovalEvents(id);
  return NextResponse.json({ success: true, approvalRequest: requestData, events });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const payload = await request.json();
    const action = payload?.action;
    const actor = payload?.actor ?? "tj";
    const reason = payload?.reason ?? "No reason provided.";

    if (action === "approve") {
      const decision = await approvalService.approve(id, actor, reason);
      const approvalRequest = await approvalService.getApprovalRequest(id);

      if (!approvalRequest) {
        return NextResponse.json({ success: true, decision });
      }

      const execution = await executeApprovedComposioAction({
        action: approvalRequest.action,
        payloadSummary: approvalRequest.payloadSummary ?? approvalRequest.reason,
        userId: "tj",
      }).catch((error) => createToolFailureResult(approvalRequest.action, error));

      if (!execution) {
        return NextResponse.json({
          success: true,
          decision,
          execution: null,
          message: "Approved. This action does not have an automatic executor yet.",
        });
      }

      if (execution.ok && execution.status === "success") {
        const completed = await approvalService.markExecuted(id, actor, {
          action: approvalRequest.action,
          toolSlug: execution.toolSlug,
          logId: execution.logId,
          summary: execution.summary.slice(0, 500),
        });
        return NextResponse.json({ success: true, decision, approvalRequest: completed, execution });
      }

      const failed = await approvalService.markFailed(
        id,
        actor,
        execution.error ?? execution.summary ?? "Approved tool execution failed.",
      );
      return NextResponse.json({ success: false, decision, approvalRequest: failed, execution }, { status: 502 });
    }

    if (action === "reject") {
      const decision = await approvalService.reject(id, actor, reason);
      return NextResponse.json({ success: true, decision });
    }

    if (action === "cancel") {
      const decision = await approvalService.cancel(id, actor, reason);
      return NextResponse.json({ success: true, decision });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update approval request." }, { status: 400 });
  }
}
