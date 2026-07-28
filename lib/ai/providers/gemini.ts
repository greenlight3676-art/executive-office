import { ProviderAdapter, ProviderConfig } from "./types";
import { ConfigurationError, ProviderError } from "../errors";

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
};

export function createGeminiAdapter(config: ProviderConfig): ProviderAdapter {
  return {
    name: "gemini",
    async send(request) {
      if (!config.apiKey) {
        throw new ConfigurationError("Gemini API key is not configured.");
      }

      const model = request.mode === "deep" ? config.deepModel : config.defaultModel;
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: request.message }] }],
              generationConfig: { maxOutputTokens: request.maxOutputTokens ?? 400 },
            }),
            signal: controller.signal,
          },
        );

        const payload = (await response.json().catch(() => null)) as GeminiResponse | { error?: { message?: string } } | null;
        if (!response.ok) {
          const message =
            payload && "error" in payload && payload.error?.message
              ? payload.error.message
              : `Gemini request failed with status ${response.status}.`;
          throw new ProviderError("Gemini request failed.", { cause: message });
        }

        const data = payload as GeminiResponse | null;
        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("")
            .trim() ?? "";

        return {
          provider: "gemini",
          model,
          text,
          inputTokens: data?.usageMetadata?.promptTokenCount,
          outputTokens: data?.usageMetadata?.candidatesTokenCount,
          requestDuration: Date.now() - startedAt,
          metadata: {
            executive: request.executive,
            conversationId: request.conversationId,
          },
        };
      } catch (error) {
        if (error instanceof ProviderError) throw error;

        throw new ProviderError("Gemini request failed.", {
          cause: error instanceof Error ? error.message : String(error),
        });
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}