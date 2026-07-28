import { NextResponse } from "next/server";
import { listExecutiveAgents } from "@/lib/ai/router";

export async function GET() {
  const executives = listExecutiveAgents().map((executive) => ({
    id: executive.id,
    name: executive.name,
    symbol: executive.symbol,
    role: executive.role,
    mandate: executive.mandate,
    motto: executive.motto,
    communicationStyle: executive.communicationStyle,
    accent: executive.accent,
    description: executive.description,
    defaultProvider: executive.defaultProvider,
    capabilities: executive.allowedCapabilities,
  }));

  return NextResponse.json({ success: true, executives });
}
