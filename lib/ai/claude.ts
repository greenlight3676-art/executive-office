import Anthropic from "@anthropic-ai/sdk";
import { AIResponse } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function askClaude(prompt: string, executive: string): Promise<AIResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 400,
    system: `You are ${executive}, a senior executive operating inside FORGE.`,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  return {
    provider: "claude",
    model: "claude-3-5-sonnet-latest",
    content: content || "No response generated.",
  };
}
