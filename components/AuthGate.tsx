"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabaseClient, isBrowserAuthConfigured } from "@/lib/auth/browser";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [message, setMessage] = useState("");

  const supabase = getBrowserSupabaseClient();
  const authConfigured = isBrowserAuthConfigured();

  useEffect(() => {
    if (!supabase) {
      void Promise.resolve().then(() => setIsLoading(false));
      return;
    }

    let isMounted = true;

    void Promise.resolve().then(async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMessage("");
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const credentials = { email: email.trim(), password };
      const result =
        mode === "create"
          ? await supabase.auth.signUp(credentials)
          : await supabase.auth.signInWithPassword(credentials);

      if (result.error) {
        throw result.error;
      }

      if (mode === "create" && !result.data.session) {
        setMessage("Account created. Check your email to confirm it, then sign in.");
      }
    } catch (authError) {
      setMessage(authError instanceof Error ? authError.message : "Unable to authenticate.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (!authConfigured) {
    return (
      <>
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Supabase auth is not configured in this environment, so Forge is running in local test mode.
        </div>
        {children}
      </>
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-sm text-zinc-400">
          Checking Forge session...
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Forge Private Access</p>
          <h1 className="mt-3 text-2xl font-semibold">Sign in to continue</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Phase 3 protects messages, missions, approvals, and boardroom runs behind your Supabase session.
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/30 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`rounded-xl px-3 py-2 ${mode === "sign-in" ? "bg-white text-zinc-950" : "text-zinc-400"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded-xl px-3 py-2 ${mode === "create" ? "bg-white text-zinc-950" : "text-zinc-400"}`}
            >
              Create
            </button>
          </div>

          <form onSubmit={submitAuth} className="mt-5 space-y-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              required
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Working..." : mode === "create" ? "Create account" : "Sign in"}
            </button>
          </form>

          {message ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
              {message}
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="border-b border-white/10 bg-zinc-950 px-4 py-2 text-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs">
          <span className="truncate text-zinc-400">Signed in as {session.user.email}</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-200 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </>
  );
}