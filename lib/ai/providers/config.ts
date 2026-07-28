import { ProviderConfig } from "./types";
export function getProviderConfig(env: Record<string, string | undefined>): Record<"openai" | "anthropic", ProviderConfig> {
  const openaiApiKey = env.OPENAI_API_KEY ?? "";
  const anthropicApiKey = env.ANTHROPIC_API_KEY ?? env.CLAUDE_API_KEY ?? "";

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
  };
}
