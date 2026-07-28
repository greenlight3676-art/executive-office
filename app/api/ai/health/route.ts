import { NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";

export async function GET() {
  try {
    const config = getProviderConfig(process.env);

    return NextResponse.json({
      openai: { configured: Boolean(config.openai.apiKey) },
      anthropic: { configured: Boolean(config.anthropic.apiKey) },
    });
  } catch {
    return NextResponse.json({ error: "Health check failed." }, { status: 500 });
  }
}
