import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import type { ExecutiveId } from "@/lib/agents/types";
import { getExecutiveAgent } from "@/lib/agents/registry";
import { buildToolRouterPrompt, detectToolAction } from "@/lib/tools/router";

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

    return NextResponse.json({
      success: true,
      proposal,
      routerPrompt: proposal ? buildToolRouterPrompt(proposal) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to inspect tool request." },
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