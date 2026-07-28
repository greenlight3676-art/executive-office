import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import type { ExecutiveId } from "@/lib/agents/types";
import { getExecutiveAgent } from "@/lib/agents/registry";
import { detectToolAction } from "@/lib/tools/router";
import { executeSafeComposioAction } from "@/lib/tools/composio";

export async function POST(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const payload = await request.json();
    const message = typeof payload?.message === "string" ? payload.message : "";
    const executiveId = normalizeExecutiveId(payload?.executiveId);

    if (!message.trim()) {
      return NextResponse.json({ error: "message is required." }, { status: 400 });
    }

    const proposal = detectToolAction(message, executiveId);
    if (!proposal) {
      return NextResponse.json({ error: "No executable tool action detected." }, { status: 404 });
    }

    if (proposal.risk !== "safe") {
      return NextResponse.json(
        { error: "This tool action requires approval before execution.", proposal },
        { status: 409 },
      );
    }

    const result = await executeSafeComposioAction({
      action: proposal.action,
      payloadSummary: proposal.payloadSummary,
      userId: "tj",
    });

    if (!result) {
      return NextResponse.json({
        success: true,
        proposal,
        result: {
          ok: true,
          action: proposal.action,
          summary: "This safe action is prepared, but no direct executor is wired yet.",
        },
      });
    }

    return NextResponse.json({ success: result.ok, proposal, result }, { status: result.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to execute tool action." },
      { status: 400 },
    );
  }
}

function normalizeExecutiveId(value: unknown): ExecutiveId {
  if (typeof value !== "string") {
    throw new Error("executiveId is required.");
  }

  const normalized = value.trim().toLowerCase() as ExecutiveId;
  getExecutiveAgent(normalized);
  return normalized;
}