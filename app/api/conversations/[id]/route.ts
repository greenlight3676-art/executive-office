import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { conversationStore } from "@/lib/conversations/store";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/conversations/[id]">,
) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const [conversation, messages] = await Promise.all([
      conversationStore.getConversation(id),
      conversationStore.listMessages(id),
    ]);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation,
      messages,
      persistence: conversationStore.persistence,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load conversation." },
      { status: 500 },
    );
  }
}