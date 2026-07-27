import { getExecutiveAgent } from "@/lib/agents/registry";
import { MemoryEntry, MemoryScope } from "./types";
import { InMemoryMemoryStore } from "./in-memory-store";

export interface MemoryContext {
  executive: string;
  memories: MemoryEntry[];
  promptPrefix: string;
}

export function createMemoryRetriever(store: InMemoryMemoryStore = new InMemoryMemoryStore()) {
  return async function retrieveMemory(executiveId: string, scope: MemoryScope): Promise<MemoryContext> {
    const executive = getExecutiveAgent(executiveId);
    const memories = await store.retrieve(executiveId, scope, 8);

    const promptPrefix = memories.length > 0
      ? `Relevant ${scope} memory for ${executive.name}:\n${memories.map((entry) => `- ${entry.content}`).join("\n")}`
      : `No prior ${scope} memory for ${executive.name}.`;

    return {
      executive: executive.id,
      memories,
      promptPrefix,
    };
  };
}
