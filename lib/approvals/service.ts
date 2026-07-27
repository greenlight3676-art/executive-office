import { ApprovalRequest, ApprovalStatus } from "./types";
import { ApprovalStore } from "./types";
import { randomUUID } from "crypto";
import { DevelopmentCEOIdentityAdapter } from "@/lib/auth/ceo";

export interface ApprovalDecision {
  approvalRequestId: string;
  status: ApprovalStatus;
  decisionBy: string;
  decisionReason: string;
  expiresAt: string;
  executionStatus: "ready" | "blocked";
}

export class ApprovalService {
  private readonly ceoIdentity = new DevelopmentCEOIdentityAdapter();

  constructor(private readonly store: ApprovalStore) {}

  async createApprovalRequest(request: Omit<ApprovalRequest, "id" | "status" | "createdAt" | "expiresAt" | "executionStatus" | "decidedAt" | "decidedBy" | "decisionReason">): Promise<ApprovalRequest> {
    const approvalRequest: ApprovalRequest = {
      id: randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      executionStatus: "blocked",
      ...request,
    };

    await this.store.create(approvalRequest);
    await this.store.appendEvent({
      id: randomUUID(),
      approvalRequestId: approvalRequest.id,
      eventType: "created",
      timestamp: new Date().toISOString(),
      actorId: approvalRequest.executiveId,
      previousStatus: "pending",
      newStatus: "pending",
      safeMetadata: { action: approvalRequest.action },
    });

    return approvalRequest;
  }

  async listApprovalRequests(filters?: { executiveId?: string; status?: ApprovalStatus }) {
    return this.store.list(filters);
  }

  async getApprovalRequest(id: string) {
    return this.store.get(id);
  }

  async listApprovalEvents(id: string) {
    return this.store.listEvents(id);
  }

  async approve(id: string, actor: string, reason: string): Promise<ApprovalDecision> {
    const request = await this.store.get(id);
    if (!request) {
      throw new Error("Approval request not found.");
    }
    if (request.status !== "pending") {
      throw new Error("Approval request is not pending.");
    }
    if (new Date(request.expiresAt) < new Date()) {
      throw new Error("Approval request has expired.");
    }
    const ceoIdentity = this.ceoIdentity.getIdentity();
    if (!ceoIdentity.isCEO || ceoIdentity.id !== actor) {
      throw new Error("Only TJ can approve or reject approval requests.");
    }

    const nextStatus: ApprovalStatus = "approved";
    const updated = await this.store.update(id, {
      status: nextStatus,
      decidedAt: new Date().toISOString(),
      decidedBy: actor,
      decisionReason: reason,
      executionStatus: "ready",
    });

    await this.store.appendEvent({
      id: randomUUID(),
      approvalRequestId: id,
      eventType: "approved",
      timestamp: new Date().toISOString(),
      actorId: actor,
      previousStatus: request.status,
      newStatus: nextStatus,
      safeMetadata: { reason },
    });

    return {
      approvalRequestId: id,
      status: nextStatus,
      decisionBy: actor,
      decisionReason: reason,
      expiresAt: updated.expiresAt,
      executionStatus: "ready",
    };
  }

  async reject(id: string, actor: string, reason: string): Promise<ApprovalDecision> {
    const request = await this.store.get(id);
    if (!request) {
      throw new Error("Approval request not found.");
    }
    if (request.status !== "pending") {
      throw new Error("Approval request is not pending.");
    }
    const ceoIdentity = this.ceoIdentity.getIdentity();
    if (!ceoIdentity.isCEO || ceoIdentity.id !== actor) {
      throw new Error("Only TJ can approve or reject approval requests.");
    }

    const updated = await this.store.update(id, {
      status: "rejected",
      decidedAt: new Date().toISOString(),
      decidedBy: actor,
      decisionReason: reason,
      executionStatus: "blocked",
    });

    await this.store.appendEvent({
      id: randomUUID(),
      approvalRequestId: id,
      eventType: "rejected",
      timestamp: new Date().toISOString(),
      actorId: actor,
      previousStatus: request.status,
      newStatus: "rejected",
      safeMetadata: { reason },
    });

    return {
      approvalRequestId: id,
      status: "rejected",
      decisionBy: actor,
      decisionReason: reason,
      expiresAt: updated.expiresAt,
      executionStatus: "blocked",
    };
  }

  async cancel(id: string, actor: string, reason: string): Promise<ApprovalDecision> {
    const request = await this.store.get(id);
    if (!request) {
      throw new Error("Approval request not found.");
    }
    if (request.status !== "pending") {
      throw new Error("Approval request is not pending.");
    }

    const ceoIdentity = this.ceoIdentity.getIdentity();
    if (!ceoIdentity.isCEO || ceoIdentity.id !== actor) {
      throw new Error("Only TJ can cancel approval requests.");
    }

    const updated = await this.store.update(id, {
      status: "cancelled",
      decidedAt: new Date().toISOString(),
      decidedBy: actor,
      decisionReason: reason,
      executionStatus: "blocked",
    });

    await this.store.appendEvent({
      id: randomUUID(),
      approvalRequestId: id,
      eventType: "cancelled",
      timestamp: new Date().toISOString(),
      actorId: actor,
      previousStatus: request.status,
      newStatus: "cancelled",
      safeMetadata: { reason },
    });

    return {
      approvalRequestId: id,
      status: "cancelled",
      decisionBy: actor,
      decisionReason: reason,
      expiresAt: updated.expiresAt,
      executionStatus: "blocked",
    };
  }
}
