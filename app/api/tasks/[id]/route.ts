import { NextRequest, NextResponse } from "next/server";
import { forgeRuntime } from "@/lib/operations/runtime";

const { missionService } = forgeRuntime;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const task = await missionService.updateTask(id, payload);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update task." }, { status: 400 });
  }
}
