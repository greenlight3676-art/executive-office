import { ApprovalService } from "../service";
import { InMemoryApprovalStore } from "../in-memory-store";

describe("approval workflow", () => {
  it("creates approval requests and preserves audit events", async () => {
    const store = new InMemoryApprovalStore();
    const service = new ApprovalService(store);

    const created = await service.createApprovalRequest({
      executiveId: "brayko",
      action: "deploy",
      reason: "Release a new build",
      riskLevel: "high",
      estimatedCost: 250,
      conversationId: "conv-1",
    });

    const events = await store.listEvents(created.id);
    expect(created.status).toBe("pending");
    expect(created.executionStatus).toBe("blocked");
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("created");
  });

  it("approves requests only when requested by TJ", async () => {
    const store = new InMemoryApprovalStore();
    const service = new ApprovalService(store);

    const created = await service.createApprovalRequest({
      executiveId: "orynth",
      action: "publish",
      reason: "Publish the board update",
      riskLevel: "medium",
    });

    await expect(service.approve(created.id, "brayko", "No")).rejects.toThrow(/Only TJ/);

    const decision = await service.approve(created.id, "tj", "CEO sign-off");
    expect(decision.status).toBe("approved");
    expect(decision.executionStatus).toBe("ready");
  });

  it("rejects requests and keeps the audit trail", async () => {
    const store = new InMemoryApprovalStore();
    const service = new ApprovalService(store);

    const created = await service.createApprovalRequest({
      executiveId: "lunexa",
      action: "send-external-message",
      reason: "Notify partners",
      riskLevel: "medium",
    });

    const decision = await service.reject(created.id, "tj", "Too risky");
    expect(decision.status).toBe("rejected");
    expect(decision.executionStatus).toBe("blocked");

    const events = await store.listEvents(created.id);
    expect(events.some((event) => event.eventType === "rejected")).toBe(true);
  });

  it("prevents a second decision on the same request", async () => {
    const store = new InMemoryApprovalStore();
    const service = new ApprovalService(store);

    const created = await service.createApprovalRequest({
      executiveId: "vyreel",
      action: "spend-money",
      reason: "Increase paid promotion",
      riskLevel: "high",
    });

    await service.approve(created.id, "tj", "Approved");
    await expect(service.reject(created.id, "tj", "Too late")).rejects.toThrow(/not pending/);
  });

  it("marks approved requests as executed", async () => {
    const store = new InMemoryApprovalStore();
    const service = new ApprovalService(store);

    const created = await service.createApprovalRequest({
      executiveId: "orynth",
      action: "send-external-message",
      reason: "Send a customer update",
      riskLevel: "medium",
    });

    await service.approve(created.id, "tj", "Approved");
    const executed = await service.markExecuted(created.id, "tj", { executor: "test" });
    const events = await service.listApprovalEvents(created.id);

    expect(executed.status).toBe("executed");
    expect(executed.executionStatus).toBe("executed");
    expect(events.some((event) => event.eventType === "executed")).toBe(true);
  });
});