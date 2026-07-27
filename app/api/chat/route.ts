import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { validateChatPayload } from "@/lib/ai/validation";
import { createCostPolicy, enforceCostPolicy } from "@/lib/ai/cost-policy";
import { resolveExecutiveProvider } from "@/lib/ai/router";
import { AIError, ConfigurationError, ValidationError } from "@/lib/ai/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateChatPayload({
      message: body?.prompt,
      executive: body?.executive ?? "orynth",
      mode: body?.provider === "deep" ? "deep" : "default",
    });

    const config = getProviderConfig(process.env);
    const costPolicy = createCostPolicy();
    enforceCostPolicy(validated.message, 400, costPolicy);

    const provider = resolveExecutiveProvider(validated.executive, config);
    const response = await provider.send({
      message: validated.message,
      executive: validated.executive,
      mode: validated.mode === "deep" ? "deep" : "default",
      maxOutputTokens: 400,
    });

    return NextResponse.json({ responses: [response] });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof AIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
