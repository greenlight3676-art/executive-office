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