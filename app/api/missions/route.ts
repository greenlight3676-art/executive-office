import { NextRequest, NextResponse } from "next/server";
import { MissionService } from "@/lib/operations/service";
import { InMemoryMissionRepository, InMemoryTaskRepository } from "@/lib/repositories/in-memory";

const missionService = new MissionService({
  missions: new InMemoryMissionRepository(),
  tasks: new InMemoryTaskRepository(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const mission = await missionService.createMission({
      title: payload?.title,
      description: payload?.description,
      projectId: payload?.projectId,
      createdBy: payload?.createdBy,
      assignedExecutives: payload?.assignedExecutives ?? [],
      priority: payload?.priority ?? "medium",
      status: payload?.status,
      dueAt: payload?.dueAt,
      metadata: payload?.metadata,
    });

    return NextResponse.json({ success: true, mission });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create mission." }, { status: 400 });
  }
}

export async function GET() {
  const missions = await missionService.listMissions();
  return NextResponse.json({ success: true, missions });
}
