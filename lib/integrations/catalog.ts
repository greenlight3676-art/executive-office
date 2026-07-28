import type { ExecutiveId } from "@/lib/agents/types";
import { isSupabaseConfigured } from "@/lib/repositories/supabase";

export type IntegrationStatus = "connected" | "available" | "not_configured";
export type IntegrationCategory = "platform" | "ai" | "automation" | "communication" | "commerce" | "social";

export type ForgeIntegration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
  requiredEnv: string[];
  executives: ExecutiveId[];
  approvalRequiredFor: string[];
};

type IntegrationDefinition = Omit<ForgeIntegration, "status"> & {
  isConnected: (env: NodeJS.ProcessEnv) => boolean;
};

const definitions: IntegrationDefinition[] = [
  {
    id: "github",
    name: "GitHub",
    category: "platform",
    description: "Source control, code review, and executive build commits.",
    requiredEnv: ["GITHUB_TOKEN or GitHub app connection"],
    executives: ["brayko", "orynth"],
    approvalRequiredFor: ["commit-code", "open-pr", "merge-to-main"],
    isConnected: (env) => Boolean(env.GITHUB_TOKEN || env.VERCEL_GIT_REPO_OWNER),
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "platform",
    description: "Production deploys and preview URLs from GitHub commits.",
    requiredEnv: ["VERCEL"],
    executives: ["brayko", "orynth"],
    approvalRequiredFor: ["deploy-production", "rollback-production"],
    isConnected: (env) => Boolean(env.VERCEL || env.VERCEL_URL),
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "platform",
    description: "Auth, database, storage, and persistent Forge memory.",
    requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    executives: ["orynth", "brayko"],
    approvalRequiredFor: ["write-sensitive-data", "delete-data"],
    isConnected: isSupabaseConfigured,
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    description: "Fast executive reasoning, chat, and synthesis.",
    requiredEnv: ["OPENAI_API_KEY"],
    executives: ["orynth", "vyreel", "kavro"],
    approvalRequiredFor: ["high-cost-run"],
    isConnected: (env) => Boolean(env.OPENAI_API_KEY),
  },
  {
    id: "claude",
    name: "Claude",
    category: "ai",
    description: "Builder-grade reasoning, coding review, and strategic critique.",
    requiredEnv: ["ANTHROPIC_API_KEY or CLAUDE_API_KEY"],
    executives: ["brayko", "lunexa"],
    approvalRequiredFor: ["high-cost-run"],
    isConnected: (env) => Boolean(env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY),
  },
  {
    id: "gemini",
    name: "Gemini",
    category: "ai",
    description: "Optional third model lane for research and long-context work.",
    requiredEnv: ["GEMINI_API_KEY"],
    executives: ["orynth", "brayko"],
    approvalRequiredFor: ["high-cost-run"],
    isConnected: (env) => Boolean(env.GEMINI_API_KEY),
  },
  {
    id: "composio",
    name: "Composio",
    category: "automation",
    description: "Unified action layer for Gmail, Calendar, Slack, Notion, GitHub, and more.",
    requiredEnv: ["COMPOSIO_API_KEY"],
    executives: ["orynth", "brayko", "lunexa", "vyreel"],
    approvalRequiredFor: ["send-external-message", "modify-external-app"],
    isConnected: (env) => Boolean(env.COMPOSIO_API_KEY),
  },
  {
    id: "e2b",
    name: "E2B",
    category: "automation",
    description: "Isolated code sandboxes for build, test, and file-return workflows.",
    requiredEnv: ["E2B_API_KEY"],
    executives: ["brayko"],
    approvalRequiredFor: ["run-code", "commit-generated-code"],
    isConnected: (env) => Boolean(env.E2B_API_KEY),
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    description: "Inbox triage, customer replies, follow-ups, and deployment emails.",
    requiredEnv: ["COMPOSIO_API_KEY or Gmail OAuth"],
    executives: ["orynth", "vyreel"],
    approvalRequiredFor: ["send-external-message"],
    isConnected: (env) => Boolean(env.GMAIL_CLIENT_ID || env.COMPOSIO_API_KEY),
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "communication",
    description: "Schedule planning, reminders, client calls, and executive deadlines.",
    requiredEnv: ["COMPOSIO_API_KEY or Google Calendar OAuth"],
    executives: ["orynth"],
    approvalRequiredFor: ["create-calendar-event", "invite-external-person"],
    isConnected: (env) => Boolean(env.GOOGLE_CALENDAR_CLIENT_ID || env.COMPOSIO_API_KEY),
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "commerce",
    description: "Payments, subscriptions, checkout links, and revenue tracking.",
    requiredEnv: ["STRIPE_SECRET_KEY"],
    executives: ["kavro", "orynth"],
    approvalRequiredFor: ["create-paid-resource", "issue-refund", "change-price"],
    isConnected: (env) => Boolean(env.STRIPE_SECRET_KEY),
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    description: "Content publishing, campaign tracking, and growth workflows.",
    requiredEnv: ["COMPOSIO_API_KEY or Instagram Graph credentials"],
    executives: ["vyreel", "lunexa"],
    approvalRequiredFor: ["publish-content", "send-external-message"],
    isConnected: (env) => Boolean(env.INSTAGRAM_ACCESS_TOKEN || env.COMPOSIO_API_KEY),
  },
];

export function listForgeIntegrations(env: NodeJS.ProcessEnv = process.env): ForgeIntegration[] {
  return definitions.map((definition) => ({
    ...definition,
    status: definition.isConnected(env) ? "connected" : "not_configured",
  }));
}

export function getIntegrationSummary(integrations: ForgeIntegration[]) {
  const connected = integrations.filter((integration) => integration.status === "connected").length;
  return {
    total: integrations.length,
    connected,
    remaining: integrations.length - connected,
  };
}