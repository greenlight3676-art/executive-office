import type { ExecutiveId } from "@/lib/agents/types";
import { getExecutiveAgent } from "@/lib/agents/registry";

export type ToolActionRisk = "safe" | "approval_required" | "unsupported";

export type ToolActionProposal = {
  tool: "gmail" | "google-docs" | "google-sheets" | "calendar" | "github" | "e2b" | "notion" | "perplexity" | "unknown";
  action: string;
  executiveId: ExecutiveId;
  risk: ToolActionRisk;
  reason: string;
  payloadSummary: string;
};

type ToolRule = {
  tool: ToolActionProposal["tool"];
  action: string;
  keywords: string[];
  executives: ExecutiveId[];
  approvalAction?: string;
  readOnly?: boolean;
  reason: string;
};

const toolRules: ToolRule[] = [
  {
    tool: "gmail",
    action: "read-email",
    keywords: ["check gmail", "read gmail", "check inbox", "read inbox", "what emails"],
    executives: ["orynth", "vyreel"],
    readOnly: true,
    reason: "Read-only inbox review can run without sending messages.",
  },
  {
    tool: "gmail",
    action: "send-email",
    keywords: ["send email", "email this", "reply to", "send message", "follow up"],
    executives: ["orynth", "vyreel"],
    approvalAction: "send-external-message",
    reason: "External messages need TJ approval before they are sent.",
  },
  {
    tool: "google-docs",
    action: "create-doc",
    keywords: ["save to docs", "google doc", "create doc", "write doc", "save brief"],
    executives: ["orynth", "lunexa"],
    readOnly: true,
    reason: "Creating an internal draft document is allowed as a safe workspace action.",
  },
  {
    tool: "google-sheets",
    action: "append-sheet-row",
    keywords: ["add to sheet", "google sheet", "log this", "track this", "add lead"],
    executives: ["kavro", "vyreel", "orynth"],
    readOnly: true,
    reason: "Appending internal tracking rows is allowed as a safe workspace action.",
  },
  {
    tool: "calendar",
    action: "read-calendar",
    keywords: ["check calendar", "read calendar", "what is on my calendar", "calendar today", "calendar this week"],
    executives: ["orynth"],
    readOnly: true,
    reason: "Read-only calendar review can run without changing events.",
  },
  {
    tool: "calendar",
    action: "create-calendar-event",
    keywords: ["schedule", "book", "create event", "add event", "remind me"],
    executives: ["orynth"],
    approvalAction: "create-calendar-event",
    reason: "Calendar changes can invite people or affect commitments, so they need approval first.",
  },
  {
    tool: "github",
    action: "inspect-repository",
    keywords: ["check github", "inspect repo", "repo status", "github status", "open issues"],
    executives: ["brayko", "orynth"],
    readOnly: true,
    reason: "Repository inspection is read-only and can run without modifying branches.",
  },
  {
    tool: "github",
    action: "commit-code",
    keywords: ["commit", "pull request", "pr", "push", "merge"],
    executives: ["brayko"],
    approvalAction: "modify-production-system",
    reason: "Code changes need approval before touching GitHub branches.",
  },
  {
    tool: "e2b",
    action: "run-sandbox-code",
    keywords: ["run code", "test code", "sandbox", "e2b"],
    executives: ["brayko"],
    readOnly: true,
    reason: "Sandbox checks can run safely when they do not commit, deploy, or call external systems.",
  },
  {
    tool: "notion",
    action: "create-note",
    keywords: ["notion", "save note", "project notes"],
    executives: ["orynth", "lunexa"],
    readOnly: true,
    reason: "Creating internal notes is allowed as a safe workspace action.",
  },
  {
    tool: "perplexity",
    action: "research",
    keywords: ["research", "look up", "find info", "perplexity"],
    executives: ["orynth", "vyreel", "brayko"],
    readOnly: true,
    reason: "Research is read-only and can run before a final executive answer.",
  },
];

export function detectToolAction(message: string, executiveId: ExecutiveId): ToolActionProposal | null {
  const normalized = message.toLowerCase();
  const rule = toolRules.find((candidate) =>
    candidate.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (!rule) {
    return null;
  }

  const executive = getExecutiveAgent(executiveId);
  const allowedForExecutive = rule.executives.includes(executiveId);

  if (!allowedForExecutive) {
    return {
      tool: rule.tool,
      action: rule.action,
      executiveId,
      risk: "unsupported",
      reason: `${executive.name} is not assigned to ${rule.tool}. Use ${rule.executives.join(", ")} instead.`,
      payloadSummary: summarizePayload(message),
    };
  }

  return {
    tool: rule.tool,
    action: rule.approvalAction ?? rule.action,
    executiveId,
    risk: rule.approvalAction ? "approval_required" : "safe",
    reason: rule.reason,
    payloadSummary: summarizePayload(message),
  };
}

export function buildToolRouterPrompt(proposal: ToolActionProposal) {
  if (proposal.risk === "approval_required") {
    return `Tool request detected: ${proposal.tool}/${proposal.action}. TJ approval is required before execution. Explain what will happen after approval and ask for confirmation if details are missing.`;
  }

  if (proposal.risk === "unsupported") {
    return `Tool request detected but blocked: ${proposal.reason}. Redirect TJ to the correct executive and do not claim the tool ran.`;
  }

  return `Tool request detected: ${proposal.tool}/${proposal.action}. This is safe to prepare. Explain the planned tool action, any missing details, and do not claim it ran unless the backend returns a tool result.`;
}

function summarizePayload(message: string) {
  return message.trim().replace(/\s+/g, " ").slice(0, 220);
}