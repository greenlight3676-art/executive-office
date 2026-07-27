import Anthropic from "@anthropic-ai/sdk";
import { ProviderAdapter, ProviderConfig, ProviderRequest, ProviderResponse } from "./types";
import { ConfigurationError, ProviderError } from "../errors";

export function createAnthropicAdapter(config: ProviderConfig): ProviderAdapter {
  const client = new Anthropic({ apiKey: config.apiKey });

  return {
    name: "anthropic",
    async send(request) {
      if (!config.apiKey) {
        throw new ConfigurationError("Anthropic API key is not configured.");
      }

      const startedAt = Date.now();

      try {
        const response = await client.messages.create({
          model: request.mode === "deep" ? config.deepModel : config.defaultModel,
          max_tokens: request.maxOutputTokens ?? 400,
          messages: [{ role: "user", content: request.message }],
        });

        const text = response.content
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("\n");

        return {
          provider: "anthropic",
          model: request.mode === "deep" ? config.deepModel : config.defaultModel,
          text,
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
          requestDuration: Date.now() - startedAt,
          requestId: response.id,
          metadata: {
            executive: request.executive,
            conversationId: request.conversationId,
          },
        };
      } catch (error) {
        throw new ProviderError("Anthropic request failed.", {
          cause: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
