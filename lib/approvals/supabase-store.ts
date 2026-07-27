import { SupabaseClientLike } from "@/lib/repositories/supabase";
import { ApprovalEvent, ApprovalRequest, ApprovalStore, ApprovalStatus } from "./types";

function toApprovalRequest(row: Record<string, unknown>): ApprovalRequest {
  return {
    id: String(row.id ?? ""),
    executiveId: String(row.executive_id ?? row.executiveId ?? ""),
    action: String(row.action ?? ""),
    reason: String(row.reason ?? ""),
    riskLevel: (row.risk_level ?? row.riskLevel ?? "medium") as ApprovalRequest["riskLevel"],
    estimatedCost: row.estimated_cost !== undefined ? Number(row.estimated_cost) : undefined,
    projectId: row.project_id ? String(row.project_id) : undefined,
    conversationId: row.conversation_id ? String(row.conversation_id) : undefined,
    payloadSummary: row.payload_summary ? String(row.payload_summary) : undefined,
    status: (row.status ?? "pending") as ApprovalRequest["status"],
    createdAt: String(row.created_at ?? ""),
    expiresAt: String(row.expires_at ?? ""),
    decidedAt: row.decided_at ? String(row.decided_at) : undefined,
    decidedBy: row.decided_by ? String(row.decided_by) : undefined,
    decisionReason: row.decision_reason ? String(row.decision_reason) : undefined,
    executionStatus: (row.execution_status ?? "blocked") as ApprovalRequest["executionStatus"],
  };
}

function toApprovalEvent(row: Record<string, unknown>): ApprovalEvent {
  return {
    id: String(row.id ?? ""),
    approvalRequestId: String(row.approval_request_id ?? ""),
    eventType: String(row.event_type ?? ""),
    timestamp: String(row.timestamp ?? ""),
    actorId: String(row.actor_id ?? ""),
    previousStatus: (row.previous_status ?? "pending") as ApprovalStatus,
    newStatus: (row.new_status ?? "pending") as ApprovalStatus,
    safeMetadata: row.safe_metadata && typeof row.safe_metadata === "object" ? (row.safe_metadata as Record<string, unknown>) : undefined,
  };
}

function toApprovalRow(request: Partial<ApprovalRequest>) {
  return {
    id: request.id,
    executive_id: request.executiveId,
    action: request.action,
    reason: request.reason,
    risk_level: request.riskLevel,
    estimated_cost: request.estimatedCost,
    project_id: request.projectId,
    conversation_id: request.conversationId,
    payload_summary: request.payloadSummary,
    status: request.status,
    created_at: request.createdAt,
    expires_at: request.expiresAt,
    decided_at: request.decidedAt,
    decided_by: request.decidedBy,
    decision_reason: request.decisionReason,
    execution_status: request.executionStatus,
  };
}

function toApprovalEventRow(event: ApprovalEvent) {
  return {
    id: event.id,
    approval_request_id: event.approvalRequestId,
    event_type: event.eventType,
    actor_id: event.actorId,
    previous_status: event.previousStatus,
    new_status: event.newStatus,
    timestamp: event.timestamp,
    safe_metadata: event.safeMetadata,
  };
}

export class SupabaseApprovalStore implements ApprovalStore {
  constructor(private readonly client: SupabaseClientLike) {}

  async create(request: ApprovalRequest): Promise<ApprovalRequest> {
    const { data, error } = await this.client.from("approvals").insert(toApprovalRow(request)).select().single();
    if (error) throw error;
    return toApprovalRequest(data as Record<string, unknown>);
  }

  async list(filters?: { executiveId?: string; status?: ApprovalStatus }): Promise<ApprovalRequest[]> {
    const response = await this.client.from("approvals").select("*");
    const data = (response as { data?: Array<Record<string, unknown>>; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;

    return (data ?? []).filter((row) => {
      const matchesExecutive = !filters?.executiveId || String(row.executive_id ?? row.executiveId ?? "") === filters.executiveId;
      const matchesStatus = !filters?.status || String(row.status ?? "") === filters.status;
      return matchesExecutive && matchesStatus;
    }).map((row) => toApprovalRequest(row));
  }

  async get(id: string): Promise<ApprovalRequest | null> {
    const response = await this.client.from("approvals").select("*").eq("id", id).maybeSingle();
    const data = (response as { data?: Record<string, unknown> | null; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;
    return data ? toApprovalRequest(data as Record<string, unknown>) : null;
  }

  async update(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest> {
    const { data, error } = await this.client.from("approvals").update(toApprovalRow(updates)).eq("id", id).select().single();
    if (error) throw error;
    return toApprovalRequest(data as Record<string, unknown>);
  }

  async appendEvent(event: ApprovalEvent): Promise<void> {
    const { error } = await this.client.from("approval_events").insert(toApprovalEventRow(event)).select().single();
    if (error) throw error;
  }

  async listEvents(approvalRequestId: string): Promise<ApprovalEvent[]> {
    const response = await this.client.from("approval_events").select("*");
    const data = (response as { data?: Array<Record<string, unknown>>; error?: unknown }).data;
    const error = (response as { error?: unknown }).error;
    if (error) throw error;

    return (data ?? []).filter((row) => String(row.approval_request_id ?? "") === approvalRequestId).map((row) => toApprovalEvent(row));
  }
}
