import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { forgeRuntime } from "@/lib/operations/runtime";

const { missionService } = forgeRuntime;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const { id } = await params;
  const mission = await missionService.getMission(id);
  if (!mission) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  return NextResponse.json({ success: true, mission });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const payload = await request.json();
    const existing = await missionService.getMission(id);

    if (!existing) {
      return NextResponse.json({ error: "Mission not found." }, { status: 404 });
    }

    const mission = await missionService.updateMission(id, payload);
    return NextResponse.json({ success: true, mission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update mission." },
      { status: 400 },
    );
  }
}