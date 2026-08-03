import OpenAI from "openai";
import { AIResponse } from "./types";

export async function askOpenAI(prompt: string, executive: string): Promise<AIResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `Executive: ${executive}\n\n${prompt}`,
  });

  return {
    provider: "openai",
    model: "gpt-4.1-mini",
    content: response.output_text ?? "No response generated.",
  };
}
