export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled" | "executed" | "failed";

export type ApprovalRiskLevel = "low" | "medium" | "high";

export interface ApprovalRequest {
  id: string;
  executiveId: string;
  action: string;
  reason: string;
  riskLevel: ApprovalRiskLevel;
  estimatedCost?: number;
  projectId?: string;
  conversationId?: string;
  payloadSummary?: string;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
  executionStatus: "pending" | "ready" | "blocked" | "executed" | "failed";
}

export interface ApprovalEvent {
  id: string;
  approvalRequestId: string;
  eventType: string;
  timestamp: string;
  actorId: string;
  previousStatus: ApprovalStatus;
  newStatus: ApprovalStatus;
  safeMetadata?: Record<string, unknown>;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalStore {
  create(request: ApprovalRequest): Promise<ApprovalRequest>;
  list(filters?: { executiveId?: string; status?: ApprovalStatus }): Promise<ApprovalRequest[]>;
  get(id: string): Promise<ApprovalRequest | null>;
  update(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest>;
  appendEvent(event: ApprovalEvent): Promise<void>;
  listEvents(approvalRequestId: string): Promise<ApprovalEvent[]>;
}
