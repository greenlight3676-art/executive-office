import { getExecutiveAgent, getExecutiveRegistry } from "@/lib/agents/registry";
import { getProviderConfig } from "./providers/config";
import { createAnthropicAdapter } from "./providers/anthropic";
import { createOpenAIAdapter } from "./providers/openai";
import { ProviderAdapter } from "./providers/types";

export function resolveExecutiveProvider(executive: string, config: ReturnType<typeof getProviderConfig>): ProviderAdapter {
  switch (executive) {
    case "brayko":
    case "lunexa":
      return createAnthropicAdapter(config.anthropic);
    case "orynth":
    case "vyreel":
    case "kavro":
    default:
      return createOpenAIAdapter(config.openai);
  }
}

export function loadExecutiveContext(executive: string) {
  return getExecutiveAgent(executive);
}

export function listExecutiveAgents() {
  return Object.values(getExecutiveRegistry());
}
