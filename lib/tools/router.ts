import type { ExecutiveId } from "@/lib/agents/types";
import { getExecutiveAgent } from "@/lib/agents/registry";

export type ToolActionRisk = "safe" | "approval_required" | "unsupported";

export type ToolActionProposal = {
  tool:
    | "gmail"
    | "google-docs"
    | "google-sheets"
    | "calendar"
    | "github"
    | "e2b"
    | "notion"
    | "linear"
    | "supabase"
    | "perplexity"
    | "unknown";
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
  reason: string;
};

const toolRules: ToolRule[] = [
  {
    tool: "gmail",
    action: "read-email",
    keywords: ["check gmail", "read gmail", "check inbox", "read inbox", "what emails", "search email"],
    executives: ["orynth", "vyreel"],
    reason: "Read-only inbox review can run without sending messages.",
  },
  {
    tool: "gmail",
    action: "create-email-draft",
    keywords: ["draft email", "prepare email", "write an email draft", "draft a reply"],
    executives: ["orynth", "vyreel"],
    approvalAction: "create-email-draft",
    reason: "Creating content in an external account needs TJ approval.",
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
    tool: "calendar",
    action: "read-calendar",
    keywords: ["check calendar", "read calendar", "what is on my calendar", "calendar today", "calendar this week"],
    executives: ["orynth"],
    reason: "Read-only calendar review can run without changing events.",
  },
  {
    tool: "calendar",
    action: "create-calendar-event",
    keywords: ["schedule", "book", "create event", "add event", "remind me"],
    executives: ["orynth"],
    approvalAction: "create-calendar-event",
    reason: "Calendar changes affect commitments, so they need approval first.",
  },
  {
    tool: "calendar",
    action: "update-calendar-event",
    keywords: ["reschedule", "move the meeting", "update calendar event", "change the event"],
    executives: ["orynth"],
    approvalAction: "update-calendar-event",
    reason: "Changing calendar commitments needs TJ approval.",
  },
  {
    tool: "calendar",
    action: "delete-calendar-event",
    keywords: ["cancel the meeting", "delete calendar event", "remove the event"],
    executives: ["orynth"],
    approvalAction: "delete-calendar-event",
    reason: "Deleting calendar commitments needs TJ approval.",
  },
  {
    tool: "github",
    action: "inspect-repository",
    keywords: ["check github", "inspect repo", "repo status", "github status", "open issues"],
    executives: ["brayko", "orynth"],
    reason: "Repository inspection is read-only and can run without modifying branches.",
  },
  {
    tool: "github",
    action: "create-github-issue",
    keywords: ["create github issue", "open github issue", "file an issue"],
    executives: ["brayko", "orynth"],
    approvalAction: "create-github-issue",
    reason: "Creating external project work needs TJ approval.",
  },
  {
    tool: "github",
    action: "create-pull-request",
    keywords: ["create pull request", "open pull request", "open a pr", "make a pr"],
    executives: ["brayko"],
    approvalAction: "create-pull-request",
    reason: "Opening a pull request changes the repository workflow and needs approval.",
  },
  {
    tool: "github",
    action: "merge-pull-request",
    keywords: ["merge pull request", "merge the pr", "merge this"],
    executives: ["brayko"],
    approvalAction: "merge-pull-request",
    reason: "Merging code changes production history and needs approval.",
  },
  {
    tool: "github",
    action: "commit-code",
    keywords: ["commit", "push", "update github files", "change the repo"],
    executives: ["brayko"],
    approvalAction: "commit-code",
    reason: "Code changes need approval before touching GitHub branches.",
  },
  {
    tool: "google-docs",
    action: "create-doc",
    keywords: ["save to docs", "google doc", "create doc", "write doc", "save brief"],
    executives: ["orynth", "lunexa"],
    approvalAction: "create-doc",
    reason: "Writing to Google Docs changes an external workspace and needs approval.",
  },
  {
    tool: "google-sheets",
    action: "append-sheet-row",
    keywords: ["add to sheet", "google sheet", "log this", "track this", "add lead"],
    executives: ["kavro", "vyreel", "orynth"],
    approvalAction: "append-sheet-row",
    reason: "Writing to a spreadsheet needs TJ approval.",
  },
  {
    tool: "notion",
    action: "create-note",
    keywords: ["notion", "save note", "project notes"],
    executives: ["orynth", "lunexa"],
    approvalAction: "create-note",
    reason: "Writing to Notion needs TJ approval.",
  },
  {
    tool: "linear",
    action: "create-linear-issue",
    keywords: ["create linear issue", "add linear task", "file linear ticket"],
    executives: ["orynth", "brayko"],
    approvalAction: "create-linear-issue",
    reason: "Creating external project work needs TJ approval.",
  },
  {
    tool: "linear",
    action: "update-linear-issue",
    keywords: ["update linear issue", "move linear task", "close linear issue"],
    executives: ["orynth", "brayko"],
    approvalAction: "update-linear-issue",
    reason: "Changing external project work needs TJ approval.",
  },
  {
    tool: "supabase",
    action: "read-database",
    keywords: ["check supabase", "read database", "query database", "database status"],
    executives: ["orynth", "brayko", "kavro"],
    reason: "Read-only database inspection can run without changing data.",
  },
  {
    tool: "supabase",
    action: "write-database",
    keywords: ["update database", "insert into database", "delete from database", "change supabase"],
    executives: ["brayko", "orynth"],
    approvalAction: "write-database",
    reason: "Database writes can change or delete data and need TJ approval.",
  },
  {
    tool: "e2b",
    action: "run-sandbox-code",
    keywords: ["run code", "test code", "sandbox", "e2b"],
    executives: ["brayko"],
    reason: "Sandbox checks can run safely when they do not commit, deploy, or call external systems.",
  },
  {
    tool: "perplexity",
    action: "research",
    keywords: ["research", "look up", "find info", "perplexity"],
    executives: ["orynth", "vyreel", "brayko"],
    reason: "Research is read-only and can run before a final executive answer.",
  },
];

export function detectToolAction(message: string, executiveId: ExecutiveId): ToolActionProposal | null {
  const normalized = message.toLowerCase();
  const rule = toolRules.find((candidate) =>
    candidate.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (!rule) return null;

  const executive = getExecutiveAgent(executiveId);
  if (!rule.executives.includes(executiveId)) {
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
  return message.trim().replace(/\s+/g, " ").slice(0, 500);
}
