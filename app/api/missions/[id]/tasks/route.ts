import { NextRequest, NextResponse } from "next/server";
import { MissionService } from "@/lib/operations/service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "@/lib/repositories/in-memory";

const missionService = new MissionService({
  missions: new InMemoryMissionRepository(),
  tasks: new InMemoryTaskRepository(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const task = await missionService.createTask(id, {
      title: payload?.title,
      description: payload?.description,
      assignedExecutive: payload?.assignedExecutive,
      priority: payload?.priority ?? "medium",
      dependencyIds: payload?.dependencyIds ?? [],
      requiresApproval: payload?.requiresApproval ?? false,
      approvalRequestId: payload?.approvalRequestId,
      dueAt: payload?.dueAt,
      metadata: payload?.metadata,
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create task." }, { status: 400 });
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tasks = await missionService.listTasks(id);
  return NextResponse.json({ success: true, tasks });
}
