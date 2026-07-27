import { ApprovalEvent, ApprovalRequest, ApprovalStore, ApprovalStatus } from "./types";

export class InMemoryApprovalStore implements ApprovalStore {
  private readonly requests = new Map<string, ApprovalRequest>();
  private readonly events = new Map<string, ApprovalEvent[]>();

  async create(request: ApprovalRequest): Promise<ApprovalRequest> {
    this.requests.set(request.id, request);
    this.events.set(request.id, []);
    return request;
  }

  async list(filters?: { executiveId?: string; status?: ApprovalStatus }): Promise<ApprovalRequest[]> {
    return Array.from(this.requests.values()).filter((request) => {
      const matchesExecutive = !filters?.executiveId || request.executiveId === filters.executiveId;
      const matchesStatus = !filters?.status || request.status === filters.status;
      return matchesExecutive && matchesStatus;
    });
  }

  async get(id: string): Promise<ApprovalRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async update(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest> {
    const current = this.requests.get(id);
    if (!current) {
      throw new Error(`Approval request not found: ${id}`);
    }

    const next = { ...current, ...updates };
    this.requests.set(id, next);
    return next;
  }

  async appendEvent(event: ApprovalEvent): Promise<void> {
    const current = this.events.get(event.approvalRequestId) ?? [];
    current.push(event);
    this.events.set(event.approvalRequestId, current);
  }

  async listEvents(approvalRequestId: string): Promise<ApprovalEvent[]> {
    return this.events.get(approvalRequestId) ?? [];
  }
}
