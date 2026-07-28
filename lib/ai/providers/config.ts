import { ProviderConfig } from "./types";
export function getProviderConfig(env: Record<string, string | undefined>): Record<"openai" | "anthropic" | "gemini", ProviderConfig> {
  const openaiApiKey = env.OPENAI_API_KEY ?? "";
  const anthropicApiKey = env.ANTHROPIC_API_KEY ?? env.CLAUDE_API_KEY ?? "";
  const geminiApiKey = env.GEMINI_API_KEY ?? "";

  return {
    openai: {
      apiKey: openaiApiKey,
      defaultModel: env.OPENAI_DEFAULT_MODEL ?? "gpt-4.1-mini",
      deepModel: env.OPENAI_DEEP_MODEL ?? "gpt-4.1",
      timeoutMs: 15000,
    },
    anthropic: {
      apiKey: anthropicApiKey,
      defaultModel: env.ANTHROPIC_DEFAULT_MODEL ?? "claude-sonnet-5",
      deepModel: env.ANTHROPIC_DEEP_MODEL ?? "claude-opus-5",
      timeoutMs: 20000,
    },
    gemini: {
      apiKey: geminiApiKey,
      defaultModel: env.GEMINI_DEFAULT_MODEL ?? "gemini-2.5-flash",
      deepModel: env.GEMINI_DEEP_MODEL ?? "gemini-2.5-pro",
      timeoutMs: 20000,
    },
  };
}