import { NextResponse } from "next/server";
import { getApiAuthStatus } from "@/lib/auth/api";

export async function GET() {
  return NextResponse.json(getApiAuthStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
