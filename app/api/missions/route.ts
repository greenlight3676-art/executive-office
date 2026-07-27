import { NextRequest, NextResponse } from "next/server";
import { forgeRuntime } from "@/lib/operations/runtime";

const { missionService } = forgeRuntime;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    if (typeof payload?.title !== "string" || !payload.title.trim()) {
      return NextResponse.json({ error: "Mission title is required." }, { status: 400 });
    }

    const mission = await missionService.createMission({
      title: payload.title.trim(),
      description: typeof payload?.description === "string" ? payload.description : "",
      projectId: typeof payload?.projectId === "string" && payload.projectId ? payload.projectId : "forge",
      createdBy: typeof payload?.createdBy === "string" && payload.createdBy ? payload.createdBy : "orynth",
      assignedExecutives: Array.isArray(payload?.assignedExecutives) ? payload.assignedExecutives : [],
      priority: payload?.priority ?? "medium",
      status: payload?.status,
      dueAt: payload?.dueAt,
      metadata: payload?.metadata,
    });

    return NextResponse.json({ success: true, mission }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create mission." },
      { status: 400 },
    );
  }
}

export async function GET() {
  const missions = await missionService.listMissions();
  return NextResponse.json({ success: true, missions });
}
