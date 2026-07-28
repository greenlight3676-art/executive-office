import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { getIntegrationSummary, listForgeIntegrations } from "@/lib/integrations/catalog";

export async function GET(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const integrations = listForgeIntegrations(process.env);

  return NextResponse.json({
    success: true,
    integrations,
    summary: getIntegrationSummary(integrations),
  });
}