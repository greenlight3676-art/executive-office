import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { forgeRuntime } from "@/lib/operations/runtime";

const { missionService } = forgeRuntime;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const payload = await request.json();

    if (typeof payload?.title !== "string" || !payload.title.trim()) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    const task = await missionService.createTask(id, {
      title: payload.title.trim(),
      description: typeof payload?.description === "string" ? payload.description : "",
      assignedExecutive: payload?.assignedExecutive,
      priority: payload?.priority ?? "medium",
      dependencyIds: Array.isArray(payload?.dependencyIds) ? payload.dependencyIds : [],
      requiresApproval: payload?.requiresApproval ?? false,
      approvalRequestId: payload?.approvalRequestId,
      dueAt: payload?.dueAt,
      metadata: payload?.metadata,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create task." },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const { id } = await params;
  const mission = await missionService.getMission(id);

  if (!mission) {
    return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  }

  const tasks = await missionService.listTasks(id);
  return NextResponse.json({ success: true, tasks });
}