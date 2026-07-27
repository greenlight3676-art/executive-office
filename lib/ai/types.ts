export type AIProvider = "openai" | "claude" | "both";

export interface AIRequest {
  prompt: string;
  executive: string;
  provider: AIProvider;
}

export interface AIResponse {
  provider: Exclude<AIProvider, "both">;
  model: string;
  content: string;
}
