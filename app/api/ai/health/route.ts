import { NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { ConfigurationError } from "@/lib/ai/errors";

export async function GET() {
  try {
    const config = getProviderConfig(process.env);

    return NextResponse.json({
      openai: { configured: Boolean(config.openai.apiKey) },
      anthropic: { configured: Boolean(config.anthropic.apiKey) },
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        {
          openai: { configured: false },
          anthropic: { configured: false },
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Health check failed." }, { status: 500 });
  }
}
