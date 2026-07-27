import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approvals/store";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { executiveId, action, reason, riskLevel, estimatedCost, projectId, conversationId, payloadSummary } = payload ?? {};

    if (typeof executiveId !== "string" || typeof action !== "string" || typeof reason !== "string") {
      return NextResponse.json({ error: "executiveId, action, and reason are required strings." }, { status: 400 });
    }

    const approvalRequest = await approvalService.createApprovalRequest({
      executiveId,
      action,
      reason,
      riskLevel: riskLevel ?? "medium",
      estimatedCost,
      projectId,
      conversationId,
      payloadSummary,
    });

    return NextResponse.json({ success: true, approvalRequest });
  } catch {
    return NextResponse.json({ error: "Unable to create approval request." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    status: (searchParams.get("status") as "pending" | "approved" | "rejected" | "expired" | "cancelled" | "executed" | "failed" | null | undefined) ?? undefined,
    executiveId: searchParams.get("executiveId") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
    riskLevel: (searchParams.get("riskLevel") as "low" | "medium" | "high" | null | undefined) ?? undefined,
  };

  const requests = await approvalService.listApprovalRequests(filters);
  return NextResponse.json({ success: true, approvalRequests: requests });
}
