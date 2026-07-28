export type ProviderName = "openai" | "anthropic" | "gemini";

export interface ProviderConfig {
  apiKey: string;
  defaultModel: string;
  deepModel: string;
  timeoutMs: number;
}

export interface ProviderResponse {
  provider: ProviderName;
  model: string;
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  requestDuration: number;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderRequest {
  message: string;
  executive: string;
  mode: "default" | "deep";
  conversationId?: string;
  maxOutputTokens?: number;
}

export interface ProviderAdapter {
  name: ProviderName;
  send(request: ProviderRequest): Promise<ProviderResponse>;
}