"use client";

import { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/auth/browser";

type Integration = {
  id: string;
  name: string;
  category: string;
  status: "connected" | "available" | "not_configured";
  description: string;
  requiredEnv: string[];
  executives: string[];
  approvalRequiredFor: string[];
};

type IntegrationsPayload = {
  integrations?: Integration[];
  summary?: {
    total: number;
    connected: number;
    remaining: number;
  };
};

type SandboxResult = {
  ok?: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs?: number;
  sandboxId?: string;
};

type ComposioStatus = {
  ok?: boolean;
  toolCount?: number;
  checkedToolkits?: string[];
  tools?: Array<{ slug: string; name: string; toolkit?: string }>;
  error?: string;
};

const categoryLabels: Record<string, string> = {
  platform: "Platform",
  ai: "AI",
  automation: "Automation",
  communication: "Communication",
  commerce: "Commerce",
  social: "Social",
};

function statusStyles(status: Integration["status"]) {
  if (status === "connected") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "available") {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
  }

  return "border-white/10 bg-white/5 text-zinc-400";
}

function statusLabel(status: Integration["status"]) {
  if (status === "connected") return "Connected";
  if (status === "available") return "Available";
  return "Needs key";
}

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [summary, setSummary] = useState<IntegrationsPayload["summary"]>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);
  const [composioStatus, setComposioStatus] = useState<ComposioStatus | null>(null);
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);
  const [isCheckingComposio, setIsCheckingComposio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadIntegrations() {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/integrations", { cache: "no-store" });
      const payload = (await response.json()) as IntegrationsPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load integrations.");
      setIntegrations(Array.isArray(payload.integrations) ? payload.integrations : []);
      setSummary(payload.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load integrations.");
    } finally {
      setIsLoading(false);
    }
  }

  async function runSandboxCheck() {
    if (isRunningSandbox) return;

    setIsRunningSandbox(true);
    setSandboxResult(null);
    setError("");

    try {
      const response = await authFetch("/api/sandbox/e2b", {
        method: "POST",
      });
      const payload = (await response.json()) as { result?: SandboxResult; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to run E2B sandbox check.");
      setSandboxResult(payload.result ?? null);
    } catch (sandboxError) {
      setError(sandboxError instanceof Error ? sandboxError.message : "Unable to run E2B sandbox check.");
    } finally {
      setIsRunningSandbox(false);
    }
  }

  async function checkComposio() {
    if (isCheckingComposio) return;

    setIsCheckingComposio(true);
    setComposioStatus(null);
    setError("");

    try {
      const response = await authFetch("/api/composio/status", { cache: "no-store" });
      const payload = (await response.json()) as { status?: ComposioStatus; error?: string };
      if (!response.ok && !payload.status) throw new Error(payload.error ?? "Unable to check Composio.");
      setComposioStatus(payload.status ?? null);
    } catch (composioError) {
      setError(composioError instanceof Error ? composioError.message : "Unable to check Composio.");
    } finally {
      setIsCheckingComposio(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadIntegrations);
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(integrations.map((integration) => integration.category)));
    return ["all", ...uniqueCategories];
  }, [integrations]);

  const visibleIntegrations = useMemo(
    () =>
      selectedCategory === "all"
        ? integrations
        : integrations.filter((integration) => integration.category === selectedCategory),
    [integrations, selectedCategory],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Phase 4</p>
          <h2 className="mt-1 text-xl font-semibold">Integrations hub</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Connect the tools Forge executives can request permission to use: code, deploys, email,
            calendars, payments, and growth channels.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300">
          <span className="font-semibold text-white">{summary?.connected ?? 0}</span>
          <span className="text-zinc-500"> / {summary?.total ?? integrations.length} connected</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              selectedCategory === category
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5"
            }`}
          >
            {category === "all" ? "All" : categoryLabels[category] ?? category}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void loadIntegrations()}
          className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            Loading integrations...
          </div>
        ) : (
          visibleIntegrations.map((integration) => (
            <article key={integration.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-zinc-100">{integration.name}</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {categoryLabels[integration.category] ?? integration.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{integration.description}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusStyles(integration.status)}`}>
                  {statusLabel(integration.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Executives</p>
                  <p className="mt-2 text-sm capitalize text-zinc-300">{integration.executives.join(", ")}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Needs</p>
                  <p className="mt-2 text-sm text-zinc-300">{integration.requiredEnv.join(", ")}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Approval gates</p>
                <p className="mt-2 text-sm text-zinc-300">{integration.approvalRequiredFor.join(", ")}</p>
              </div>

              {integration.id === "e2b" ? (
                <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">Brayko sandbox</p>
                      <p className="mt-1 text-sm text-zinc-300">
                        Runs one fixed smoke test in an isolated E2B sandbox, then shuts it down.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void runSandboxCheck()}
                      disabled={integration.status !== "connected" || isRunningSandbox}
                      className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRunningSandbox ? "Running..." : "Run sandbox check"}
                    </button>
                  </div>

                  {sandboxResult ? (
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
                      <div className="rounded-lg bg-black/30 p-2">
                        <p className="text-zinc-500">Status</p>
                        <p className={sandboxResult.ok ? "text-emerald-200" : "text-rose-200"}>
                          {sandboxResult.ok ? "Ready" : "Check failed"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-black/30 p-2">
                        <p className="text-zinc-500">Output</p>
                        <p className="truncate text-zinc-200">{sandboxResult.stdout?.trim() || "none"}</p>
                      </div>
                      <div className="rounded-lg bg-black/30 p-2">
                        <p className="text-zinc-500">Exit</p>
                        <p className="text-zinc-200">{sandboxResult.exitCode ?? "n/a"}</p>
                      </div>
                      <div className="rounded-lg bg-black/30 p-2">
                        <p className="text-zinc-500">Time</p>
                        <p className="text-zinc-200">{sandboxResult.durationMs ?? 0}ms</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {integration.id === "composio" ? (
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Tool router</p>
                      <p className="mt-1 text-sm text-zinc-300">
                        Checks Forge can see the Composio tool catalog for connected apps.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void checkComposio()}
                      disabled={integration.status !== "connected" || isCheckingComposio}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCheckingComposio ? "Checking..." : "Check tools"}
                    </button>
                  </div>

                  {composioStatus ? (
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-black/30 p-2">
                          <p className="text-zinc-500">Status</p>
                          <p className={composioStatus.ok ? "text-emerald-200" : "text-rose-200"}>
                            {composioStatus.ok ? "Ready" : "Check failed"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-black/30 p-2">
                          <p className="text-zinc-500">Tools found</p>
                          <p className="text-zinc-200">{composioStatus.toolCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-black/30 p-2">
                          <p className="text-zinc-500">Toolkits</p>
                          <p className="truncate text-zinc-200">{composioStatus.checkedToolkits?.length ?? 0} checked</p>
                        </div>
                      </div>
                      {composioStatus.tools?.length ? (
                        <p className="truncate text-zinc-300">
                          {composioStatus.tools.slice(0, 4).map((tool) => tool.slug).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}