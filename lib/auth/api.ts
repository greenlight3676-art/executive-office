import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  FORGE_OWNER_HEADER,
  isOwnerKeyConfigured,
  verifyOwnerKey,
} from "@/lib/auth/owner";

function getAuthConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return { supabaseUrl, anonKey };
}

export function isApiAuthConfigured() {
  return isOwnerKeyConfigured() || Boolean(getAuthConfig());
}

export function getApiAuthStatus() {
  const ownerKeyConfigured = isOwnerKeyConfigured();
  const supabaseConfigured = Boolean(getAuthConfig());
  return {
    ownerKeyConfigured,
    supabaseConfigured,
    localMode: !ownerKeyConfigured && !supabaseConfigured,
  };
}

export async function requireApiSession(request: NextRequest) {
  const ownerKeyConfigured = isOwnerKeyConfigured();
  const ownerKey = request.headers.get(FORGE_OWNER_HEADER);

  if (ownerKeyConfigured && verifyOwnerKey(ownerKey)) {
    return null;
  }

  const config = getAuthConfig();
  if (!config) {
    if (ownerKeyConfigured) {
      return NextResponse.json({ error: "Unlock Forge on this device." }, { status: 401 });
    }
    return null;
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

  if (!token) {
    return NextResponse.json(
      { error: ownerKeyConfigured ? "Unlock Forge or sign in." : "Sign in required." },
      { status: 401 },
    );
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
