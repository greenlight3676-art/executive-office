import { MemoryEntry, MemoryScope } from "./types";
import { InMemoryMemoryStore } from "./in-memory-store";

export function createMemorySaver(store: InMemoryMemoryStore = new InMemoryMemoryStore()) {
  return async function saveMemory(executiveId: string, scope: MemoryScope, content: string, category: string) {
    const entry: MemoryEntry = {
      id: `${executiveId}-${Date.now()}`,
      executiveId,
      scope,
      content,
      category,
      createdAt: new Date().toISOString(),
      metadata: { source: "backend-milestone-3" },
    };

    await store.save(entry);
    return entry;
  };
}
