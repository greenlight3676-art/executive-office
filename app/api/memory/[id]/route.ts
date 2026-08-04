import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { conversationStore } from "@/lib/conversations/store";

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/memory/[id]">,
) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const deleted = await conversationStore.deleteMemory(id);
    if (!deleted) {
      return NextResponse.json({ error: "Memory not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete memory." },
      { status: 400 },
    );
  }
}
