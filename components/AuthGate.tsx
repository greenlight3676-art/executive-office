"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  clearStoredOwnerKey,
  getBrowserSupabaseClient,
  getStoredOwnerKey,
  storeOwnerKey,
} from "@/lib/auth/browser";

type AuthGateProps = { children: ReactNode };
type AuthStatus = {
  ownerKeyConfigured: boolean;
  supabaseConfigured: boolean;
  localMode: boolean;
};
type GateState = "checking" | "owner-locked" | "supabase-locked" | "unlocked" | "local";

export function AuthGate({ children }: AuthGateProps) {
  const [gateState, setGateState] = useState<GateState>("checking");
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accessKind, setAccessKind] = useState<"owner" | "supabase" | "local">("local");
  const [ownerKey, setOwnerKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = getBrowserSupabaseClient();

  useEffect(() => {
    let mounted = true;

    async function verifySavedOwnerKey(key: string) {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      return response.ok;
    }

    async function bootstrap() {
      try {
        const statusResponse = await fetch("/api/auth/status", { cache: "no-store" });
        const status = (await statusResponse.json()) as AuthStatus;
        if (!mounted) return;
        setAuthStatus(status);

        if (supabase && status.supabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (!mounted) return;
          if (data.session) {
            setSession(data.session);
            setAccessKind("supabase");
            setGateState("unlocked");
            return;
          }
        }

        if (status.ownerKeyConfigured) {
          const savedKey = getStoredOwnerKey();
          if (savedKey && (await verifySavedOwnerKey(savedKey))) {
            if (!mounted) return;
            setAccessKind("owner");
            setGateState("unlocked");
            return;
          }
          clearStoredOwnerKey();
          setGateState("owner-locked");
          return;
        }

        if (status.supabaseConfigured) {
          setGateState("supabase-locked");
          return;
        }

        setAccessKind("local");
        setGateState("local");
      } catch (error) {
        if (!mounted) return;
        setMessage(error instanceof Error ? error.message : "Unable to check Forge access.");
        setGateState("local");
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function unlockOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !ownerKey.trim()) return;
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: ownerKey.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Unable to unlock Forge.");
      storeOwnerKey(ownerKey.trim());
      setOwnerKey("");
      setAccessKind("owner");
      setGateState("unlocked");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to unlock Forge.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isSubmitting) return;
    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      setSession(result.data.session);
      setAccessKind("supabase");
      setGateState("unlocked");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function lockForge() {
    clearStoredOwnerKey();
    if (supabase && session) await supabase.auth.signOut();
    setSession(null);
    setMessage("");
    setGateState(authStatus?.ownerKeyConfigured ? "owner-locked" : authStatus?.supabaseConfigured ? "supabase-locked" : "local");
  }

  if (gateState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-sm text-zinc-400">
          Checking trusted device...
        </div>
      </main>
    );
  }

  if (gateState === "local") {
    return (
      <>
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Forge is in local test mode. Set FORGE_OWNER_KEY or Supabase auth before connecting powerful tools.
        </div>
        {children}
      </>
    );
  }

  if (gateState === "owner-locked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Forge Owner Access</p>
          <h1 className="mt-3 text-2xl font-semibold">Unlock this device once</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Enter your private owner key. Forge remembers this browser until you lock it or clear its storage.
          </p>
          <form onSubmit={unlockOwner} className="mt-5 space-y-3">
            <input
              value={ownerKey}
              onChange={(event) => setOwnerKey(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
              placeholder="Private owner key"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
            />
            <button
              type="submit"
              disabled={isSubmitting || !ownerKey.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Checking..." : "Trust this device"}
            </button>
          </form>
          {authStatus?.supabaseConfigured ? (
            <button
              type="button"
              onClick={() => setGateState("supabase-locked")}
              className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-400"
            >
              Use account sign-in instead
            </button>
          ) : null}
          {message ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{message}</div> : null}
        </section>
      </main>
    );
  }

  if (gateState === "supabase-locked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Forge Private Access</p>
          <h1 className="mt-3 text-2xl font-semibold">Sign in to continue</h1>
          <form onSubmit={signIn} className="mt-5 space-y-3">
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="Email" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-cyan-400/50" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required placeholder="Password" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-cyan-400/50" />
            <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {isSubmitting ? "Working..." : "Sign in"}
            </button>
          </form>
          {authStatus?.ownerKeyConfigured ? (
            <button type="button" onClick={() => setGateState("owner-locked")} className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-400">
              Use trusted-device key instead
            </button>
          ) : null}
          {message ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{message}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="border-b border-white/10 bg-zinc-950 px-4 py-2 text-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs">
          <span className="truncate text-zinc-400">
            {accessKind === "owner" ? "Trusted owner device" : session?.user.email ? `Signed in as ${session.user.email}` : "Forge access active"}
          </span>
          <button type="button" onClick={() => void lockForge()} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-200 transition hover:bg-white/10">
            Lock
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
