const COMPOSIO_BASE_URL = "https://backend.composio.dev/api/v3.1";

export type ComposioToolSummary = {
  slug: string;
  name: string;
  toolkit?: string;
  description?: string;
};

export type ComposioStatus = {
  configured: boolean;
  ok: boolean;
  toolCount: number;
  checkedToolkits: string[];
  tools: ComposioToolSummary[];
  error?: string;
};

export type ComposioExecutionResult = {
  ok: boolean;
  toolSlug: string;
  action: string;
  summary: string;
  status: "success" | "missing_config" | "missing_connection" | "tool_error" | "unsupported";
  title: string;
  records: ComposioResultRecord[];
  data?: unknown;
  logId?: string;
  error?: string;
};

export type ComposioResultRecord = {
  title: string;
  subtitle?: string;
  detail?: string;
  url?: string;
};

type ComposioToolPayload = {
  items?: unknown[];
  tools?: unknown[];
  data?: unknown[] | { items?: unknown[]; tools?: unknown[] };
};

const coreToolkits = ["gmail", "github", "googlecalendar", "notion", "googlesheets", "slack", "supabase", "googledrive", "googledocs", "linear", "airtable"];

export function isComposioConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.COMPOSIO_API_KEY);
}

export async function getComposioStatus(env: NodeJS.ProcessEnv = process.env): Promise<ComposioStatus> {
  if (!isComposioConfigured(env)) {
    return {
      configured: false,
      ok: false,
      toolCount: 0,
      checkedToolkits: coreToolkits,
      tools: [],
      error: "COMPOSIO_API_KEY is not configured.",
    };
  }

  try {
    const tools = await searchComposioTools({ toolkits: coreToolkits, limit: 40 }, env);
    return {
      configured: true,
      ok: true,
      toolCount: tools.length,
      checkedToolkits: coreToolkits,
      tools,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      toolCount: 0,
      checkedToolkits: coreToolkits,
      tools: [],
      error: error instanceof Error ? error.message : "Unable to check Composio.",
    };
  }
}

export async function searchComposioTools(
  options: { query?: string; toolkits?: string[]; limit?: number },
  env: NodeJS.ProcessEnv = process.env,
): Promise<ComposioToolSummary[]> {
  const apiKey = env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error("COMPOSIO_API_KEY is not configured.");
  }

  const searchParams = new URLSearchParams({
    limit: String(options.limit ?? 20),
  });

  if (options.query) {
    searchParams.set("query", options.query);
  }

  if (options.toolkits?.length) {
    searchParams.set("toolkit_slug", options.toolkits.join(","));
  }

  const response = await fetch(`${COMPOSIO_BASE_URL}/tools?${searchParams.toString()}`, {
    headers: { "x-api-key": apiKey },
    next: { revalidate: 0 },
  });

  const payload = (await response.json().catch(() => ({}))) as ComposioToolPayload & {
    error?: { message?: string };
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? payload.message ?? `Composio returned ${response.status}.`);
  }

  return extractTools(payload).map(toToolSummary).filter((tool): tool is ComposioToolSummary => Boolean(tool));
}

export async function executeComposioTool(
  options: { toolSlug: string; text: string; action: string; userId?: string },
  env: NodeJS.ProcessEnv = process.env,
): Promise<ComposioExecutionResult> {
  const apiKey = env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error("COMPOSIO_API_KEY is not configured.");
  }

  const response = await fetch(`${COMPOSIO_BASE_URL}/tools/execute/${encodeURIComponent(options.toolSlug)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      text: options.text,
      user_id: options.userId ?? "tj",
      version: "latest",
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: unknown;
    error?: { message?: string } | string;
    successful?: boolean;
    log_id?: string;
  };

  if (!response.ok || payload.successful === false) {
    const error = typeof payload.error === "string" ? payload.error : payload.error?.message;
    return {
      ok: false,
      toolSlug: options.toolSlug,
      action: options.action,
      status: classifyComposioError(error, response.status),
      title: titleForAction(options.action),
      summary: error ?? `Composio returned ${response.status}.`,
      error: error ?? `Composio returned ${response.status}.`,
      records: [],
      data: payload.data,
      logId: payload.log_id,
    };
  }

  return {
    ok: true,
    toolSlug: options.toolSlug,
    action: options.action,
    status: "success",
    title: titleForAction(options.action),
    summary: summarizeToolData(payload.data),
    records: extractResultRecords(options.action, payload.data),
    data: payload.data,
    logId: payload.log_id,
  };
}

export async function executeSafeComposioAction(
  options: { action: string; payloadSummary: string; userId?: string },
  env: NodeJS.ProcessEnv = process.env,
): Promise<ComposioExecutionResult | null> {
  const toolSlug = safeActionToolSlugs[options.action];
  if (!toolSlug) return null;

  return executeComposioTool(
    {
      toolSlug,
      action: options.action,
      text: options.payloadSummary,
      userId: options.userId,
    },
    env,
  );
}

function extractTools(payload: ComposioToolPayload): unknown[] {
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.tools)) return payload.tools;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.items)) return payload.data.items;
    if (Array.isArray(payload.data.tools)) return payload.data.tools;
  }

  return [];
}

function toToolSummary(tool: unknown): ComposioToolSummary | null {
  if (!tool || typeof tool !== "object") return null;
  const record = tool as Record<string, unknown>;
  const slug = String(record.slug ?? record.tool_slug ?? record.name ?? "");
  if (!slug) return null;

  return {
    slug,
    name: String(record.display_name ?? record.name ?? slug),
    toolkit: record.toolkit_slug ? String(record.toolkit_slug) : undefined,
    description: record.description ? String(record.description).slice(0, 180) : undefined,
  };
}

const safeActionToolSlugs: Record<string, string> = {
  "read-email": "GMAIL_FETCH_EMAILS",
  "read-calendar": "GOOGLECALENDAR_FIND_EVENT",
  "inspect-repository": "GITHUB_GET_A_REPOSITORY",
  research: "PERPLEXITYAI_PERPLEXITY_AI_SEARCH",
};

export function createUnsupportedToolResult(action: string): ComposioExecutionResult {
  return {
    ok: true,
    toolSlug: "not-wired",
    action,
    status: "unsupported",
    title: titleForAction(action),
    summary: "This action is detected, but no direct executor is wired yet.",
    records: [],
  };
}

export function createToolFailureResult(action: string, error: unknown): ComposioExecutionResult {
  const message = error instanceof Error ? error.message : "Tool execution failed.";
  return {
    ok: false,
    toolSlug: "composio",
    action,
    status: message.includes("COMPOSIO_API_KEY") ? "missing_config" : "tool_error",
    title: titleForAction(action),
    summary: message,
    error: message,
    records: [],
  };
}

function summarizeToolData(data: unknown) {
  if (data === undefined || data === null) return "Tool ran successfully.";
  if (typeof data === "string") return data.slice(0, 500);

  try {
    return JSON.stringify(data).slice(0, 700);
  } catch {
    return "Tool ran successfully, but the result could not be summarized.";
  }
}

function classifyComposioError(error: string | undefined, status: number): ComposioExecutionResult["status"] {
  const normalized = error?.toLowerCase() ?? "";
  if (status === 401 || normalized.includes("api key")) return "missing_config";
  if (
    status === 403 ||
    status === 404 ||
    normalized.includes("connected account") ||
    normalized.includes("connection") ||
    normalized.includes("not connected") ||
    normalized.includes("auth")
  ) {
    return "missing_connection";
  }

  return "tool_error";
}

function titleForAction(action: string) {
  const titles: Record<string, string> = {
    "read-email": "Gmail inbox check",
    "read-calendar": "Calendar check",
    "inspect-repository": "GitHub repository check",
    research: "Research check",
  };

  return titles[action] ?? action;
}

function extractResultRecords(action: string, data: unknown): ComposioResultRecord[] {
  const values = collectCandidateRecords(data);
  return values.slice(0, 5).map((value, index) => normalizeRecord(action, value, index));
}

function collectCandidateRecords(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  for (const key of ["messages", "emails", "events", "items", "results", "repositories", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  return [data];
}

function normalizeRecord(action: string, value: unknown, index: number): ComposioResultRecord {
  if (!value || typeof value !== "object") {
    return {
      title: String(value ?? `${titleForAction(action)} result ${index + 1}`).slice(0, 120),
    };
  }

  const record = value as Record<string, unknown>;
  const title = firstString(record, ["subject", "summary", "title", "name", "full_name", "html_url"]) ?? `${titleForAction(action)} result ${index + 1}`;
  const subtitle = firstString(record, ["from", "sender", "start", "updated_at", "created_at", "owner", "status"]);
  const detail = firstString(record, ["snippet", "description", "body", "text", "message"]);
  const url = firstString(record, ["html_url", "url", "webLink", "link"]);

  return {
    title: title.slice(0, 140),
    subtitle: subtitle?.slice(0, 140),
    detail: detail?.slice(0, 240),
    url,
  };
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return undefined;
}