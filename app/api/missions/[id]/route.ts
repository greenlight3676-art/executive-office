import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { forgeRuntime } from "@/lib/operations/runtime";

const { missionService } = forgeRuntime;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const snapshot = await missionService.getMissionSnapshot(id);
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load mission.";
    return NextResponse.json(
      { error: message },
      { status: /not found/i.test(message) ? 404 : 400 },
    );
  }
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

    await missionService.updateMission(id, payload);
    const snapshot = await missionService.reconcileMission(id);
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update mission." },
      { status: 400 },
    );
  }
}
