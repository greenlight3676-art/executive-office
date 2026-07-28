"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/browser";

type ApprovalRequest = {
  id: string;
  executiveId: string;
  action: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected" | "expired" | "cancelled" | "executed" | "failed";
  createdAt: string;
  executionStatus: "pending" | "ready" | "blocked" | "executed" | "failed";
  estimatedCost?: number;
  payloadSummary?: string;
};

export function ApprovalInbox() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApprovals() {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/approvals", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load approvals.");
      setRequests(Array.isArray(payload.approvalRequests) ? payload.approvalRequests : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load approvals.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadApprovals);
  }, []);

  async function decide(id: string, action: "approve" | "reject" | "cancel") {
    setError("");

    try {
      const response = await authFetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actor: "tj",
          reason: `TJ selected ${action} from Phase 2 console.`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update approval.");
      await loadApprovals();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to update approval.");
    }
  }

  async function executeApproval(id: string) {
    setError("");

    try {
      const response = await authFetch(`/api/approvals/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "tj" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to execute approval.");
      await loadApprovals();
    } catch (executeError) {
      setError(executeError instanceof Error ? executeError.message : "Unable to execute approval.");
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">CEO Approvals</p>
          <h2 className="mt-1 text-xl font-semibold">Approval inbox</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadApprovals()}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-zinc-400">
            No approval requests yet.
          </div>
        ) : (
          requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold">{request.action}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {request.executiveId} • {request.riskLevel} risk • {request.status}
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{request.reason}</p>
                  {request.payloadSummary ? (
                    <p className="mt-1 text-xs text-zinc-500">{request.payloadSummary}</p>
                  ) : null}
                </div>
                {request.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void decide(request.id, "approve")}
                      className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void decide(request.id, "reject")}
                      className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-100"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
                {request.status === "approved" && request.executionStatus === "ready" ? (
                  <button
                    type="button"
                    onClick={() => void executeApproval(request.id)}
                    className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100"
                  >
                    Execute
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}