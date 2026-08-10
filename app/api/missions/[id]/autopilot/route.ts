import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { runMissionAutopilot } from "@/lib/operations/autopilot";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const result = await runMissionAutopilot(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run mission autopilot." },
      { status: 400 },
    );
  }
}
