import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  FORGE_OWNER_HEADER,
  isOwnerKeyConfigured,
  verifyOwnerKey,
} from "@/lib/auth/owner";

function getAuthConfig(env: NodeJS.ProcessEnv = process.env) {
  const supabaseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allowedEmail = env.FORGE_CEO_EMAIL?.trim().toLowerCase();

  if (!supabaseUrl || !anonKey || !allowedEmail) {
    return null;
  }

  return { supabaseUrl, anonKey, allowedEmail };
}

export function isApiAuthConfigured(env: NodeJS.ProcessEnv = process.env) {
  return isOwnerKeyConfigured(env) || Boolean(getAuthConfig(env));
}

export function isApiAuthMisconfiguredForProduction(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "production" && !isApiAuthConfigured(env);
}

export function getApiAuthStatus(env: NodeJS.ProcessEnv = process.env) {
  const ownerKeyConfigured = isOwnerKeyConfigured(env);
  const supabaseConfigured = Boolean(getAuthConfig(env));
  return {
    ownerKeyConfigured,
    supabaseConfigured,
    localMode: env.NODE_ENV !== "production" && !ownerKeyConfigured && !supabaseConfigured,
  };
}

export async function requireApiSession(request: NextRequest) {
  if (isApiAuthMisconfiguredForProduction()) {
    return NextResponse.json(
      { error: "Forge authentication is not configured for production." },
      { status: 503 },
    );
  }

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

  const userEmail = data.user.email?.trim().toLowerCase();
  if (userEmail !== config.allowedEmail) {
    return NextResponse.json({ error: "This Forge account is not approved." }, { status: 403 });
  }

  return null;
}
