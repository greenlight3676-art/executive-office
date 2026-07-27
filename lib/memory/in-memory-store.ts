import { MemoryEntry, MemoryScope, MemoryStore } from "./types";

export class InMemoryMemoryStore implements MemoryStore {
  private readonly entries: MemoryEntry[] = [];

  async retrieve(executiveId: string, scope: MemoryScope, limit = 10): Promise<MemoryEntry[]> {
    return this.entries
      .filter((entry) => entry.executiveId === executiveId && entry.scope === scope)
      .slice(-limit)
      .reverse();
  }

  async save(entry: MemoryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async search(query: string, scope?: MemoryScope): Promise<MemoryEntry[]> {
    const normalized = query.toLowerCase();
    return this.entries.filter((entry) => {
      const matchesScope = scope ? entry.scope === scope : true;
      return matchesScope && entry.content.toLowerCase().includes(normalized);
    });
  }
}
