import { ApprovalRequest, ExecutiveId } from "@/lib/agents/types";

const approvalSensitiveActions = new Set([
  "publish",
  "deploy",
  "delete-data",
  "send-external-message",
  "spend-money",
  "create-paid-resource",
  "modify-production-system",
  "destructive-action",
  "create-email-draft",
  "create-calendar-event",
  "update-calendar-event",
  "delete-calendar-event",
  "create-doc",
  "append-sheet-row",
  "create-note",
  "create-github-issue",
  "create-pull-request",
  "merge-pull-request",
  "commit-code",
  "create-linear-issue",
  "update-linear-issue",
  "write-database",
]);

export function buildApprovalRequest(action: string, proposedBy: ExecutiveId): ApprovalRequest {
  const normalizedAction = action.toLowerCase();
  const requiresApproval = approvalSensitiveActions.has(normalizedAction);

  if (!requiresApproval) {
    throw new Error(`Action does not require approval: ${action}`);
  }

  return {
    requiresApproval: true,
    action,
    reason: `TJ approval is required before ${action} can proceed.`,
    riskLevel: normalizedAction.includes("delete") || normalizedAction.includes("production") ? "high" : "medium",
    estimatedCost: normalizedAction.includes("spend") || normalizedAction.includes("paid") ? 100 : undefined,
    proposedBy,
  };
}

export function requiresApproval(action: string): boolean {
  return approvalSensitiveActions.has(action.toLowerCase());
}
