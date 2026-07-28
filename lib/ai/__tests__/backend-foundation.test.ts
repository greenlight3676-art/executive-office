import { createCostPolicy, enforceCostPolicy } from "../cost-policy";
import { validateBoardroomPayload, validateChatPayload } from "../validation";
import { createOpenAIAdapter } from "../providers/openai";
import { createAnthropicAdapter } from "../providers/anthropic";
import { resolveExecutiveProvider } from "../router";
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
  it("routes executives to the expected provider", () => {
    const config = getProviderConfig(process.env);
    expect(resolveExecutiveProvider("orynth", config).name).toBe("openai");
    expect(resolveExecutiveProvider("brayko", config).name).toBe("anthropic");
  });

  it("keeps Claude executives available through OpenAI when Claude is not configured", () => {
    const config = getProviderConfig({ OPENAI_API_KEY: "openai-only" });
    expect(resolveExecutiveProvider("brayko", config).name).toBe("openai");
    expect(resolveExecutiveProvider("lunexa", config).name).toBe("openai");
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
});
