import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { validateBoardroomPayload } from "@/lib/ai/validation";
import { AIError, ConfigurationError, ValidationError } from "@/lib/ai/errors";
import { resolveExecutiveProvider } from "@/lib/ai/router";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const validated = validateBoardroomPayload(payload);
    const config = getProviderConfig(process.env);

    const providers = validated.executives.slice(0, 2).map((executive) => resolveExecutiveProvider(executive, config));

    const responses = await Promise.all(
      providers.map((provider, index) =>
        provider.send({
          message: validated.message,
          executive: validated.executives[index] ?? "orynth",
          mode: "default",
          maxOutputTokens: 300,
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      responses,
      synthesize: validated.synthesize,
    });
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

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
