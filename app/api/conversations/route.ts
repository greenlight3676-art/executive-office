import { NextRequest, NextResponse } from "next/server";
import { getExecutiveAgent } from "@/lib/agents/registry";
import type { ExecutiveId } from "@/lib/agents/types";
import { requireApiSession } from "@/lib/auth/api";
import { conversationStore } from "@/lib/conversations/store";

function readExecutiveId(value: unknown): ExecutiveId {
  if (typeof value !== "string") {
    throw new Error("Executive is required.");
  }

  const normalized = value.trim().toLowerCase() as ExecutiveId;
  getExecutiveAgent(normalized);
  return normalized;
}

export async function GET(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const rawExecutive = request.nextUrl.searchParams.get("executiveId");
    const executiveId = rawExecutive ? readExecutiveId(rawExecutive) : undefined;
    const conversations = await conversationStore.listConversations(executiveId);

    return NextResponse.json({
      success: true,
      conversations,
      persistence: conversationStore.persistence,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load conversations." },
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
    const executive = getExecutiveAgent(executiveId);
    const title =
      typeof payload?.title === "string" && payload.title.trim()
        ? payload.title.trim().slice(0, 80)
        : `${executive.name} briefing`;

    const conversation = await conversationStore.createConversation({
      executiveId,
      title,
    });

    return NextResponse.json(
      {
        success: true,
        conversation,
        persistence: conversationStore.persistence,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create conversation." },
      { status: 400 },
    );
  }
}