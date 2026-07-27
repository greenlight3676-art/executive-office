export type MemoryScope = "short-term" | "long-term" | "project" | "company";

export interface MemoryEntry {
  id: string;
  executiveId: string;
  scope: MemoryScope;
  content: string;
  category: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryStore {
  retrieve(executiveId: string, scope: MemoryScope, limit?: number): Promise<MemoryEntry[]>;
  save(entry: MemoryEntry): Promise<void>;
  search(query: string, scope?: MemoryScope): Promise<MemoryEntry[]>;
}
