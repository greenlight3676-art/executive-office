import { NextRequest, NextResponse } from "next/server";
import { getExecutiveAgent } from "@/lib/agents/registry";
import type { ExecutiveId } from "@/lib/agents/types";
import { requireApiSession } from "@/lib/auth/api";
import { conversationStore } from "@/lib/conversations/store";

function readExecutiveId(value: unknown): ExecutiveId {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "orynth";
  getExecutiveAgent(normalized);
  return normalized as ExecutiveId;
}

export async function GET(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const executiveId = readExecutiveId(request.nextUrl.searchParams.get("executiveId"));
    const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? 30);
    const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 30;
    const memories = await conversationStore.listMemories(executiveId, limit);

    return NextResponse.json({
      success: true,
      memories,
      persistence: conversationStore.persistence,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load memory." },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const payload = await request.json();
    const executiveId = readExecutiveId(payload?.executiveId);
    const content = typeof payload?.content === "string" ? payload.content.trim() : "";
    const scope = ["short-term", "long-term", "project"].includes(payload?.scope)
      ? payload.scope
      : "long-term";

    if (!content) {
      return NextResponse.json({ error: "Memory content is required." }, { status: 400 });
    }

    const memory = await conversationStore.createMemory({
      executiveId,
      scope,
      content: content.slice(0, 1600),
      kind: "manual-owner-memory",
      metadata: { source: "memory-center" },
    });

    return NextResponse.json(
      { success: true, memory, persistence: conversationStore.persistence },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save memory." },
      { status: 400 },
    );
  }
}
