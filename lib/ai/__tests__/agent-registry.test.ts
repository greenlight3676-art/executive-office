import { getExecutiveAgent, getExecutiveRegistry } from "@/lib/agents/registry";
import { buildApprovalRequest, requiresApproval } from "@/lib/security/permissions";
import { resolveExecutiveProvider } from "@/lib/ai/router";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { validateChatPayload } from "@/lib/ai/validation";
import { createOpenAIAdapter } from "@/lib/ai/providers/openai";
import { createAnthropicAdapter } from "@/lib/ai/providers/anthropic";

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

describe("executive agent registry", () => {
  it("maps every executive to the correct provider", () => {
    const config = getProviderConfig(process.env);
    expect(resolveExecutiveProvider("orynth", config).name).toBe("openai");
    expect(resolveExecutiveProvider("brayko", config).name).toBe("anthropic");
    expect(resolveExecutiveProvider("lunexa", config).name).toBe("anthropic");
    expect(resolveExecutiveProvider("vyreel", config).name).toBe("openai");
    expect(resolveExecutiveProvider("kavro", config).name).toBe("openai");
  });

  it("loads the correct prompt for every executive", () => {
    expect(getExecutiveAgent("orynth").systemPrompt).toContain("Orynth");
    expect(getExecutiveAgent("brayko").systemPrompt).toContain("Brayko");
    expect(getExecutiveAgent("lunexa").systemPrompt).toContain("Lunexa");
    expect(getExecutiveAgent("vyreel").systemPrompt).toContain("Vyreel");
    expect(getExecutiveAgent("kavro").systemPrompt).toContain("Kavro");
  });

  it("rejects invalid executive ids", () => {
    expect(() => getExecutiveAgent("unknown" as never)).toThrow("Unknown executive");
    expect(() => validateChatPayload({ message: "hello", executive: "unknown" })).toThrow();
  });

  it("detects approval-required actions", () => {
    expect(requiresApproval("publish")).toBe(true);
    expect(requiresApproval("plan")).toBe(false);
    expect(buildApprovalRequest("spend-money", "kavro").requiresApproval).toBe(true);
  });

  it("uses one provider call for normal chat", async () => {
    const openai = createOpenAIAdapter({
      apiKey: "key",
      defaultModel: "gpt-4.1-mini",
      deepModel: "gpt-4.1",
      timeoutMs: 15000,
    });

    const response = await openai.send({ message: "hello", executive: "orynth", mode: "default" });
    expect(response.provider).toBe("openai");
    expect(response.text).toContain("OpenAI");
  });

  it("assigns different token limits by executive", () => {
    const orynth = getExecutiveAgent("orynth");
    const kavro = getExecutiveAgent("kavro");
    expect(orynth.maxOutputTokens).toBeGreaterThan(kavro.maxOutputTokens);
  });

  it("prevents executives from bypassing CEO approval", () => {
    const approval = buildApprovalRequest("modify-production-system", "brayko");
    expect(approval.proposedBy).toBe("brayko");
    expect(approval.requiresApproval).toBe(true);
  });

  it("exposes the registry", () => {
    const registry = getExecutiveRegistry();
    expect(Object.keys(registry)).toEqual(["orynth", "brayko", "lunexa", "vyreel", "kavro"]);
  });
});
