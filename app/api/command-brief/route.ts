import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approvals/store";
import { requireApiSession } from "@/lib/auth/api";
import { createCommandBrief } from "@/lib/command-brief/service";
import { listForgeIntegrations } from "@/lib/integrations/catalog";
import { forgeRuntime } from "@/lib/operations/runtime";

export async function GET(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const missions = await forgeRuntime.missionService.listMissions();
  const taskEntries = await Promise.all(
    missions.map(async (mission) => [mission.id, await forgeRuntime.missionService.listTasks(mission.id)] as const),
  );
  const approvals = await approvalService.listApprovalRequests();

  return NextResponse.json({
    success: true,
    brief: createCommandBrief({
      missions,
      tasksByMission: new Map(taskEntries),
      approvals,
      integrations: listForgeIntegrations(process.env),
      persistence: forgeRuntime.persistence,
    }),
  });
}
