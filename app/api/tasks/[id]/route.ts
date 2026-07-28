import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { forgeRuntime } from "@/lib/operations/runtime";

const { missionService } = forgeRuntime;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const payload = await request.json();
    const task = await missionService.updateTask(id, payload);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update task." }, { status: 400 });
  }
}