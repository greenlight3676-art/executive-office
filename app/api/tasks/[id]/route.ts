import { NextRequest, NextResponse } from "next/server";
import { MissionService } from "@/lib/operations/service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "@/lib/repositories/in-memory";

const missionService = new MissionService({
  missions: new InMemoryMissionRepository(),
  tasks: new InMemoryTaskRepository(),
});

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
