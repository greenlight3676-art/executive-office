import { NextResponse } from "next/server";
import { forgeRuntime } from "@/lib/operations/runtime";
import { isSupabaseConfigured } from "@/lib/repositories/supabase";

export async function GET() {
  return NextResponse.json({
    success: true,
    persistence: forgeRuntime.persistence,
    supabaseConfigured: isSupabaseConfigured(),
  });
}
