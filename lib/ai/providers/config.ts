import { ProviderConfig } from "./types";
import { ConfigurationError } from "../errors";

export function getProviderConfig(env: Record<string, string | undefined>): Record<"openai" | "anthropic", ProviderConfig> {
  const openaiApiKey = env.OPENAI_API_KEY;
  const anthropicApiKey = env.ANTHROPIC_API_KEY ?? env.CLAUDE_API_KEY;

  if (!openaiApiKey) {
    throw new ConfigurationError("OPENAI_API_KEY is required.");
  }

  if (!anthropicApiKey) {
    throw new ConfigurationError("ANTHROPIC_API_KEY or CLAUDE_API_KEY is required.");
  }

  return {
    openai: {
      apiKey: openaiApiKey,
      defaultModel: env.OPENAI_DEFAULT_MODEL ?? "gpt-4.1-mini",
      deepModel: env.OPENAI_DEEP_MODEL ?? "gpt-4.1",
      timeoutMs: 15000,
    },
    anthropic: {
      apiKey: anthropicApiKey,
      defaultModel: env.ANTHROPIC_DEFAULT_MODEL ?? "claude-sonnet-4-20250514",
      deepModel: env.ANTHROPIC_DEEP_MODEL ?? "claude-sonnet-4-20250514",
      timeoutMs: 20000,
    },
  };
}
