"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { FORGE_OWNER_HEADER } from "@/lib/auth/constants";

const OWNER_STORAGE_KEY = "forge.owner.key";
let browserClient: SupabaseClient | null = null;

export function isBrowserAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getBrowserSupabaseClient() {
  if (!isBrowserAuthConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return browserClient;
}

export function getStoredOwnerKey() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(OWNER_STORAGE_KEY);
}

export function storeOwnerKey(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OWNER_STORAGE_KEY, value);
}

export function clearStoredOwnerKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OWNER_STORAGE_KEY);
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getAccessToken() {
  const session = await getCurrentSession();
  return session?.access_token ?? null;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const [token, ownerKey] = await Promise.all([
    getAccessToken(),
    Promise.resolve(getStoredOwnerKey()),
  ]);
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (ownerKey) {
    headers.set(FORGE_OWNER_HEADER, ownerKey);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
