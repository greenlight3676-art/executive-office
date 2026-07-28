import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { getComposioStatus } from "@/lib/tools/composio";

export async function GET(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const status = await getComposioStatus(process.env);
  const responseStatus = status.configured ? 200 : 503;

  return NextResponse.json({ success: status.ok, status }, { status: responseStatus });
}