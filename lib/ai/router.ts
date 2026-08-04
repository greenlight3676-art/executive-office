import { getExecutiveAgent, getExecutiveRegistry } from "@/lib/agents/registry";
import { getForgeBrainMode } from "./brain-policy";
import { getProviderConfig } from "./providers/config";
import { createAnthropicAdapter } from "./providers/anthropic";
import { createGeminiAdapter } from "./providers/gemini";
import { createOpenAIAdapter } from "./providers/openai";
import { ProviderAdapter, ProviderRequest, ProviderResponse } from "./providers/types";
import { ProviderError } from "./errors";

export function resolveExecutiveProvider(executive: string, config: ReturnType<typeof getProviderConfig>): ProviderAdapter {
  const brainMode = getForgeBrainMode();

  // Default Forge V2 behavior: one primary reasoning brain. Executive profiles
  // still shape prompts and responsibilities, while ChatGPT handles the answer.
  if (brainMode === "chatgpt-first" && config.openai.apiKey) {
    return createOpenAIAdapter(config.openai);
  }

  switch (executive) {
    case "brayko":
    case "lunexa":
      return config.anthropic.apiKey
        ? createAnthropicAdapter(config.anthropic)
        : createOpenAIAdapter(config.openai);
    case "orynth":
      return config.gemini.apiKey
        ? createGeminiAdapter(config.gemini)
        : createOpenAIAdapter(config.openai);
    case "vyreel":
    case "kavro":
    default:
      return createOpenAIAdapter(config.openai);
  }
}

export async function sendExecutiveRequest(
  executive: string,
  config: ReturnType<typeof getProviderConfig>,
  request: ProviderRequest,
): Promise<ProviderResponse> {
  const primaryProvider = resolveExecutiveProvider(executive, config);

  try {
    return await primaryProvider.send(request);
  } catch (error) {
    const canFallbackToOpenAI =
      primaryProvider.name !== "openai" &&
      Boolean(config.openai.apiKey) &&
      error instanceof ProviderError;

    if (!canFallbackToOpenAI) {
      throw error;
    }

    const fallbackResponse = await createOpenAIAdapter(config.openai).send(request);
    return {
      ...fallbackResponse,
      metadata: {
        ...fallbackResponse.metadata,
        fallbackFrom: primaryProvider.name,
        fallbackReason: error.message,
      },
    };
  }
}

export function loadExecutiveContext(executive: string) {
  return getExecutiveAgent(executive);
}

export function listExecutiveAgents() {
  return Object.values(getExecutiveRegistry());
}
