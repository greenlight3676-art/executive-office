import { createCostPolicy, enforceCostPolicy } from "../cost-policy";
import { validateBoardroomPayload, validateChatPayload } from "../validation";
import { createOpenAIAdapter } from "../providers/openai";
import { createAnthropicAdapter } from "../providers/anthropic";
import { createGeminiAdapter } from "../providers/gemini";
import { resolveExecutiveProvider, sendExecutiveRequest } from "../router";
import { getProviderConfig } from "../providers/config";
import { ConfigurationError, ValidationError } from "../errors";

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: jest.fn().mockResolvedValue({
        id: "openai-test-id",
        output_text: "OpenAI response",
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    },
  })),
}));

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        id: "anthropic-test-id",
        content: [{ type: "text", text: "Claude response" }],
        usage: { input_tokens: 8, output_tokens: 4 },
      }),
    },
  })),
}));

describe("backend foundation", () => {
  afterEach(() => {
    delete process.env.FORGE_SPECIALIST_MODE;
  });

  it("routes every executive through ChatGPT by default", () => {
    const config = getProviderConfig({
      OPENAI_API_KEY: "openai",
      ANTHROPIC_API_KEY: "anthropic",
      GEMINI_API_KEY: "gemini",
    });
    expect(resolveExecutiveProvider("orynth", config).name).toBe("openai");
    expect(resolveExecutiveProvider("brayko", config).name).toBe("openai");
  });

  it("uses specialist providers only after explicit opt-in", () => {
    process.env.FORGE_SPECIALIST_MODE = "true";
    const config = getProviderConfig({
      OPENAI_API_KEY: "openai",
      ANTHROPIC_API_KEY: "anthropic",
      GEMINI_API_KEY: "gemini",
    });
    expect(resolveExecutiveProvider("orynth", config).name).toBe("gemini");
    expect(resolveExecutiveProvider("brayko", config).name).toBe("anthropic");
  });

  it("keeps Claude executives available through OpenAI when Claude is not configured", () => {
    const config = getProviderConfig({ OPENAI_API_KEY: "openai-only" });
    expect(resolveExecutiveProvider("brayko", config).name).toBe("openai");
    expect(resolveExecutiveProvider("lunexa", config).name).toBe("openai");
  });

  it("falls back to OpenAI when an opted-in Claude request fails", async () => {
    process.env.FORGE_SPECIALIST_MODE = "true";
    const AnthropicMock = jest.requireMock("@anthropic-ai/sdk").default;
    AnthropicMock.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockRejectedValue(new Error("bad anthropic key")),
      },
    }));

    const response = await sendExecutiveRequest(
      "brayko",
      getProviderConfig({
        OPENAI_API_KEY: "openai-key",
        ANTHROPIC_API_KEY: "anthropic-key",
      }),
      { message: "hello", executive: "brayko", mode: "default" },
    );

    expect(response.provider).toBe("openai");
    expect(response.metadata?.fallbackFrom).toBe("anthropic");
  });

  it("rejects invalid executive ids", () => {
    expect(() => validateChatPayload({ message: "hello", executive: "unknown" })).toThrow(ValidationError);
  });

  it("rejects oversized input", () => {
    const policy = createCostPolicy();
    expect(() => enforceCostPolicy("x".repeat(policy.maxInputLength + 1), 100, policy)).toThrow(ValidationError);
  });

  it("enforces boardroom call limits", () => {
    expect(() => validateBoardroomPayload({ message: "hello", executives: ["brayko", "kavro", "lunexa"] })).toThrow(ValidationError);
  });

  it("keeps provider configuration independent", async () => {
    const config = getProviderConfig({ OPENAI_API_KEY: "openai-only" });
    expect(config.openai.apiKey).toBe("openai-only");
    expect(config.anthropic.apiKey).toBe("");
    expect(config.gemini.apiKey).toBe("");

    const anthropic = createAnthropicAdapter(config.anthropic);
    await expect(
      anthropic.send({ message: "hello", executive: "brayko", mode: "default" }),
    ).rejects.toBeInstanceOf(ConfigurationError);
  });

  it("normalizes provider responses", async () => {
    const openai = createOpenAIAdapter({
      apiKey: "test-openai-key",
      defaultModel: "gpt-4.1-mini",
      deepModel: "gpt-4.1",
      timeoutMs: 15000,
    });

    const response = await openai.send({ message: "hello", executive: "orynth", mode: "default" });
    expect(response.provider).toBe("openai");
    expect(response.text).toBe("OpenAI response");

    const anthropic = createAnthropicAdapter({
      apiKey: "test-anthropic-key",
      defaultModel: "claude-3-5-sonnet-latest",
      deepModel: "claude-3-7-sonnet-latest",
      timeoutMs: 15000,
    });

    const claudeResponse = await anthropic.send({ message: "hello", executive: "brayko", mode: "default" });
    expect(claudeResponse.provider).toBe("anthropic");
    expect(claudeResponse.text).toBe("Claude response");
  });

  it("normalizes Gemini responses", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Gemini response" }] } }],
        usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 3 },
      }),
    } as Response);

    const gemini = createGeminiAdapter({
      apiKey: "test-gemini-key",
      defaultModel: "gemini-2.5-flash",
      deepModel: "gemini-2.5-pro",
      timeoutMs: 15000,
    });

    const response = await gemini.send({ message: "hello", executive: "orynth", mode: "default" });
    expect(response.provider).toBe("gemini");
    expect(response.text).toBe("Gemini response");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("gemini-2.5-flash"), expect.any(Object));

    fetchMock.mockRestore();
  });
});