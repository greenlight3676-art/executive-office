import { NextResponse } from "next/server";
import { conversationStore } from "@/lib/conversations/store";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/conversations/[id]">,
) {
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
