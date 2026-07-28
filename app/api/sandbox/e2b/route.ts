import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { runE2BSandboxSmokeTest } from "@/lib/sandbox/e2b";

export async function POST(request: NextRequest) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  try {
    const result = await runE2BSandboxSmokeTest(process.env);

    return NextResponse.json({
      success: result.ok,
      result,
      executive: "brayko",
      action: "sandbox-smoke-test",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to run E2B sandbox check.",
      },
      { status: 500 },
    );
  }
}