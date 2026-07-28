import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { searchComposioTools } from "@/lib/tools/composio";

export async function GET(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? undefined;
    const toolkits = searchParams.get("toolkits")?.split(",").map((toolkit) => toolkit.trim()).filter(Boolean);
    const tools = await searchComposioTools({ query, toolkits, limit: 40 }, process.env);

    return NextResponse.json({ success: true, tools });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to search Composio tools." },
      { status: 502 },
    );
  }
}