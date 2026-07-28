import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approvals/store";
import { requireApiSession } from "@/lib/auth/api";

const executableActions = new Set([
  "send-external-message",
  "create-calendar-event",
  "modify-production-system",
  "create-paid-resource",
  "spend-money",
]);

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

    if (!executableActions.has(approvalRequest.action)) {
      return NextResponse.json(
        { error: "This approval action is not connected to an executor yet." },
        { status: 409 },
      );
    }

    const executed = await approvalService.markExecuted(id, actor, {
      action: approvalRequest.action,
      executor: "phase-4-router",
      mode: "queued-for-tool-run",
    });

    return NextResponse.json({
      success: true,
      approvalRequest: executed,
      execution: {
        status: "executed",
        note: "Approval is recorded as executed. External tool mutation remains scoped to the dedicated integration executor.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to execute approval request." },
      { status: 400 },
    );
  }
}