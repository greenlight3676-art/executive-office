import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { forgeRuntime } from "@/lib/operations/runtime";
import { detectMissionIntent } from "@/lib/missions/planner";

const { missionService } = forgeRuntime;

export async function POST(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const payload = await request.json();

    if (typeof payload?.title !== "string" || !payload.title.trim()) {
      return NextResponse.json({ error: "Mission title is required." }, { status: 400 });
    }

    const intent = payload?.autoPlan
      ? detectMissionIntent(`${payload.title} ${typeof payload?.description === "string" ? payload.description : ""}`)
      : null;

    const input = {
      title: payload.title.trim(),
      description: typeof payload?.description === "string" ? payload.description : "",
      projectId: typeof payload?.projectId === "string" && payload.projectId ? payload.projectId : "forge",
      createdBy: typeof payload?.createdBy === "string" && payload.createdBy ? payload.createdBy : "orynth",
      assignedExecutives: Array.isArray(payload?.assignedExecutives)
        ? payload.assignedExecutives
        : intent?.assignedExecutives ?? [],
      priority: payload?.priority ?? "medium",
      status: payload?.status,
      dueAt: payload?.dueAt,
      metadata: {
        ...(payload?.metadata && typeof payload.metadata === "object" ? payload.metadata : {}),
        source: payload?.autoPlan ? "mission-planner" : "manual",
      },
      intent: intent ?? undefined,
    };

    const result = payload?.autoPlan
      ? await missionService.createMissionWithPlan(input)
      : { mission: await missionService.createMission(input), tasks: [] };

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create mission." },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const missions = await missionService.listMissions();
  return NextResponse.json({ success: true, missions });
}