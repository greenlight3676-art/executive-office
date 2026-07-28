import { getExecutiveAgent } from "@/lib/agents/registry";
import {
  buildExecutivePrompt,
  createConversationTitle,
  shouldSaveLongTermMemory,
} from "../context";

describe("executive conversation context", () => {
  it("recognizes user-directed long-term memory", () => {
    expect(shouldSaveLongTermMemory("Remember that I prefer short answers.")).toBe(true);
    expect(shouldSaveLongTermMemory("What should we build today?")).toBe(false);
  });

  it("creates compact conversation titles", () => {
    const title = createConversationTitle(
      "Build a persistent messages page for every Forge executive with a mobile-first layout",
    );

    expect(title.length).toBeLessThanOrEqual(54);
    expect(title.endsWith("...")).toBe(true);
  });

  it("combines identity, memory, history, and the current message", () => {
    const executive = getExecutiveAgent("brayko");
    const prompt = buildExecutivePrompt({
      executive,
      message: "What is the next build action?",
      history: [
        {
          id: "message-1",
          conversationId: "conversation-1",
          role: "user",
          content: "We need persistent messages.",
          createdAt: new Date().toISOString(),
        },
      ],
      memories: [
        {
          id: "memory-1",
          executiveId: "brayko",
          scope: "long-term",
          content: "TJ prefers mobile-first builds.",
          kind: "user-directed-memory",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(prompt).toContain("You are Brayko");
    expect(prompt).toContain("TJ prefers mobile-first builds.");
    expect(prompt).toContain("We need persistent messages.");
    expect(prompt).toContain("What is the next build action?");
  });
});
