import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approvals/store";
import { requireApiSession } from "@/lib/auth/api";
import { executeComposioTool } from "@/lib/tools/composio";

const composioExecutors: Record<string, string> = {
  "send-external-message": "GMAIL_SEND_EMAIL",
  "create-calendar-event": "GOOGLECALENDAR_CREATE_EVENT",
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const payload = await request.json().catch(() => ({}));
    const actor = typeof payload?.actor === "string" ? payload.actor : "tj";
    const approvalRequest = await approvalService.getApprovalRequest(id);

    if (!approvalRequest) {
      return NextResponse.json({ error: "Approval request not found." }, { status: 404 });
    }

    if (approvalRequest.status !== "approved" || approvalRequest.executionStatus !== "ready") {
      return NextResponse.json({ error: "Approval request is not ready for execution." }, { status: 409 });
    }

    const toolSlug = composioExecutors[approvalRequest.action];
    if (!toolSlug) {
      return NextResponse.json(
        { error: "This approved action does not have a live executor yet." },
        { status: 409 },
      );
    }

    const toolResult = await executeComposioTool({
      toolSlug,
      action: approvalRequest.action,
      text: approvalRequest.payloadSummary ?? approvalRequest.reason,
      userId: "tj",
    });

    if (!toolResult.ok) {
      const failed = await approvalService.markFailed(id, actor, toolResult.error ?? toolResult.summary);
      return NextResponse.json(
        { success: false, approvalRequest: failed, execution: toolResult },
        { status: 502 },
      );
    }

    const executed = await approvalService.markExecuted(id, actor, {
      action: approvalRequest.action,
      executor: "composio",
      toolSlug,
      logId: toolResult.logId,
      summary: toolResult.summary,
    });

    return NextResponse.json({
      success: true,
      approvalRequest: executed,
      execution: toolResult,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to execute approval request." },
      { status: 400 },
    );
  }
}
