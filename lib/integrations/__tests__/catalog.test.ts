import { getIntegrationSummary, listForgeIntegrations } from "@/lib/integrations/catalog";

describe("Forge integration catalog", () => {
  it("marks configured integrations as connected", () => {
    const integrations = listForgeIntegrations({
      OPENAI_API_KEY: "openai",
      ANTHROPIC_API_KEY: "claude",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      COMPOSIO_API_KEY: "composio",
      GEMINI_API_KEY: "gemini",
    } as NodeJS.ProcessEnv);

    expect(integrations.find((integration) => integration.id === "openai")?.status).toBe("connected");
    expect(integrations.find((integration) => integration.id === "claude")?.status).toBe("connected");
    expect(integrations.find((integration) => integration.id === "supabase")?.status).toBe("connected");
    expect(integrations.find((integration) => integration.id === "composio")?.status).toBe("connected");
    expect(integrations.find((integration) => integration.id === "gemini")?.status).toBe("connected");
    expect(integrations.find((integration) => integration.id === "e2b")?.status).toBe("not_configured");
  });

  it("summarizes connected and remaining integrations", () => {
    const integrations = listForgeIntegrations({
      OPENAI_API_KEY: "openai",
    } as NodeJS.ProcessEnv);

    expect(getIntegrationSummary(integrations)).toEqual({
      total: integrations.length,
      connected: 1,
      remaining: integrations.length - 1,
    });
  });
});