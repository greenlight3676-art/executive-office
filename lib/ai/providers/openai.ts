import OpenAI from "openai";
import { ProviderAdapter, ProviderConfig } from "./types";
import { ConfigurationError, ProviderError } from "../errors";

export function createOpenAIAdapter(config: ProviderConfig): ProviderAdapter {

  return {
    name: "openai",
    async send(request) {
      if (!config.apiKey) {
        throw new ConfigurationError("OpenAI API key is not configured.");
      }

      const startedAt = Date.now();
      const client = new OpenAI({ apiKey: config.apiKey });

      try {
        const response = await client.responses.create({
          model: request.mode === "deep" ? config.deepModel : config.defaultModel,
          input: request.message,
          max_output_tokens: request.maxOutputTokens ?? 400,
        });

        return {
          provider: "openai",
          model: request.mode === "deep" ? config.deepModel : config.defaultModel,
          text: response.output_text ?? "",
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
        throw new ProviderError("OpenAI request failed.", {
          cause: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
