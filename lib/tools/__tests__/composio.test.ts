import { executeSafeComposioAction, getComposioStatus, searchComposioTools } from "@/lib/tools/composio";

describe("Composio tool client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports missing configuration safely", async () => {
    const status = await getComposioStatus({} as NodeJS.ProcessEnv);

    expect(status.configured).toBe(false);
    expect(status.ok).toBe(false);
  });

  it("searches tool catalog with the project API key", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            slug: "GMAIL_FETCH_EMAILS",
            name: "Fetch emails",
            toolkit_slug: "gmail",
            description: "Fetch recent emails.",
          },
        ],
      }),
    } as Response);

    const tools = await searchComposioTools(
      { query: "gmail", toolkits: ["gmail"], limit: 5 },
      { COMPOSIO_API_KEY: "composio-key" } as NodeJS.ProcessEnv,
    );

    expect(tools).toEqual([
      {
        slug: "GMAIL_FETCH_EMAILS",
        name: "Fetch emails",
        toolkit: "gmail",
        description: "Fetch recent emails.",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/tools?"), expect.objectContaining({
      headers: { "x-api-key": "composio-key" },
    }));
  });
  it("executes a whitelisted safe tool through Composio", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        successful: true,
        data: { messages: [{ subject: "Deploy complete" }] },
        log_id: "log_123",
      }),
    } as Response);

    const result = await executeSafeComposioAction(
      { action: "read-email", payloadSummary: "check gmail", userId: "tj" },
      { COMPOSIO_API_KEY: "composio-key" } as NodeJS.ProcessEnv,
    );

    expect(result).toMatchObject({
      ok: true,
      toolSlug: "GMAIL_FETCH_EMAILS",
      action: "read-email",
      logId: "log_123",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/tools/execute/GMAIL_FETCH_EMAILS"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "composio-key",
        },
      }),
    );
  });

  it("does not execute unsupported safe-prep actions", async () => {
    await expect(
      executeSafeComposioAction(
        { action: "create-doc", payloadSummary: "save this", userId: "tj" },
        { COMPOSIO_API_KEY: "composio-key" } as NodeJS.ProcessEnv,
      ),
    ).resolves.toBeNull();
  });
});