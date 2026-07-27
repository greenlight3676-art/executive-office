export type ModelTier = "default" | "deep";

export interface ModelPolicy {
  defaultModel: string;
  deepModel: string;
  maxOutputTokens: number;
  timeoutMs: number;
  maxInputLength: number;
}

export function resolveModelPolicy(env: Record<string, string | undefined>): ModelPolicy {
  const defaultModel = env.OPENAI_DEFAULT_MODEL ?? env.ANTHROPIC_DEFAULT_MODEL ?? "gpt-4.1-mini";
  const deepModel = env.OPENAI_DEEP_MODEL ?? env.ANTHROPIC_DEEP_MODEL ?? "gpt-4.1";

  return {
    defaultModel,
    deepModel,
    maxOutputTokens: 400,
    timeoutMs: 15000,
    maxInputLength: 8000,
  };
}
