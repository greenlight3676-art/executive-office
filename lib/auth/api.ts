import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAuthConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return { supabaseUrl, anonKey };
}

export function isApiAuthConfigured() {
  return Boolean(getAuthConfig());
}

export async function requireApiSession(request: NextRequest) {
  const config = getAuthConfig();
  if (!config) {
    return null;
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

  if (!token) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = createClient(config.supabaseUrl, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const allowedEmail = process.env.FORGE_CEO_EMAIL?.trim().toLowerCase();
  const userEmail = data.user.email?.trim().toLowerCase();

  if (allowedEmail && userEmail !== allowedEmail) {
    return NextResponse.json({ error: "This Forge account is not approved." }, { status: 403 });
  }

  return null;
}